import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useElementSize } from '../hooks/useElementSize';
import { Icon } from './Icon';

type PageRef = number | 'reverse';

interface FlipState {
  dir: 1 | -1;
  target: number;
  left: PageRef | null;
  right: PageRef;
  front: PageRef;
  back: PageRef;
}

interface Props {
  pageCount: number;
  /** 0 始まり。見開き時はこのページを含む見開きを表示 */
  page: number;
  onPageChange: (page: number) => void;
  cols: number;
  rows: number;
  /** ポケットの中身（perPage 個。空きは null） */
  renderPockets: (pageIndex: number) => ReactNode[];
  coverLabel: ReactNode;
}

/** これ以上の幅なら見開き表示 */
const SPREAD_MIN_WIDTH = 720;
const DURATION = 480;

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const spreadOf = (page: number) => Math.ceil(page / 2);

export function Binder({
  pageCount,
  page,
  onPageChange,
  cols,
  rows,
  renderPockets,
  coverLabel,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(wrapRef);
  const spread = width >= SPREAD_MIN_WIDTH;

  // ページサイズ（幅:高さ = 3:4）
  const ratioW = spread ? 2.2 : 1.2;
  const pw = Math.max(120, Math.floor(Math.min(width / ratioW, (height - 8) / 1.43)));
  const ph = Math.round((pw * 4) / 3);
  const g = Math.round(pw * 0.11);
  const pad = Math.round(pw * 0.045);

  const N = Math.max(pageCount, 1);
  const maxSpread = Math.floor(N / 2);
  const cur = Math.min(Math.max(page, 0), N - 1);
  const s = spreadOf(cur);

  const [flip, setFlip] = useState<FlipState | null>(null);
  const angleRef = useRef(0);
  const autoRef = useRef(false);
  const rafRef = useRef(0);

  const canGo = (dir: 1 | -1) =>
    spread ? (dir === 1 ? s < maxSpread : s > 0) : dir === 1 ? cur < N - 1 : cur > 0;

  /** めくり開始（auto: ボタン・キー、drag: 指） */
  const startFlip = useCallback(
    (dir: 1 | -1, auto: boolean): boolean => {
      if (flip || !canGo(dir)) return false;
      let next: FlipState;
      if (spread) {
        const ns = s + dir;
        const target = ns === 0 ? 0 : 2 * ns <= N - 1 ? 2 * ns : 2 * ns - 1;
        next =
          dir === 1
            ? { dir, target, left: 2 * s - 1, right: 2 * ns, front: 2 * s, back: 2 * ns - 1 }
            : { dir, target, left: 2 * ns - 1, right: 2 * s, front: 2 * ns, back: 2 * s - 1 };
      } else {
        const target = cur + dir;
        next =
          dir === 1
            ? { dir, target, left: null, right: target, front: cur, back: 'reverse' }
            : { dir, target, left: null, right: cur, front: target, back: 'reverse' };
      }
      if (auto && prefersReducedMotion()) {
        onPageChange(next.target);
        return true;
      }
      angleRef.current = dir === 1 ? 0 : 180;
      autoRef.current = auto;
      setFlip(next);
      return true;
    },
    // canGo は下の値から決まる
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flip, spread, s, cur, N, maxSpread, onPageChange],
  );

  const applyAngle = (angle: number) => {
    const leaf = leafRef.current;
    if (!leaf) return;
    angleRef.current = angle;
    const lift = Math.sin((angle * Math.PI) / 180);
    leaf.style.transform = `rotateY(${-angle}deg) translateZ(${lift * 6}px)`;
    const [front, back] = leaf.querySelectorAll<HTMLElement>(
      ':scope > .binder-face > .binder-shade',
    );
    if (front) front.style.opacity = String(clamp01(angle / 90) * 0.85);
    if (back) back.style.opacity = String(clamp01((180 - angle) / 90) * 0.85);
  };

  const animateTo = (to: number, done: () => void) => {
    cancelAnimationFrame(rafRef.current);
    const from = angleRef.current;
    const dur = prefersReducedMotion() ? 0 : (DURATION * Math.abs(to - from)) / 180;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = dur ? clamp01((now - t0) / dur) : 1;
      applyAngle(from + (to - from) * ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else done();
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const finish = (commit: boolean, f: FlipState) => {
    if (commit) onPageChange(f.target);
    setFlip(null);
  };

  // leaf が描画されたら初期角度を当て、自動めくりなら走らせる
  useLayoutEffect(() => {
    if (!flip) return;
    applyAngle(angleRef.current);
    if (autoRef.current) animateTo(flip.dir === 1 ? 180 : 0, () => finish(true, flip));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ---------- ドラッグ ----------
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    id: number;
    active: boolean;
    dir: 1 | -1;
  } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (flip || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      id: e.pointerId,
      active: false,
      dir: 1,
    };
  };

  const progressOf = (dx: number, dir: 1 | -1) => clamp01((dir === 1 ? -dx : dx) / (pw * 1.1));

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      const dir = dx < 0 ? 1 : -1;
      if (!startFlip(dir, false)) {
        drag.current = null;
        return;
      }
      d.active = true;
      d.dir = dir;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const p = progressOf(dx, d.dir);
    applyAngle(d.dir === 1 ? p * 180 : 180 - p * 180);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || !flip) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    const dx = e.clientX - d.x;
    const p = progressOf(dx, d.dir);
    const speed = Math.abs(dx) / Math.max(1, performance.now() - d.t);
    const commit = e.type !== 'pointercancel' && (p > 0.35 || (speed > 0.5 && p > 0.08));
    const f = flip;
    const done = d.dir === 1 ? 180 : 0;
    const back = d.dir === 1 ? 0 : 180;
    animateTo(commit ? done : back, () => finish(commit, f));
  };

  // ---------- キーボード ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') startFlip(1, true);
      if (e.key === 'ArrowLeft') startFlip(-1, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startFlip]);

  // ---------- 描画 ----------
  const renderPage = (ref: PageRef | null) => {
    if (ref === null) return null;
    if (ref === 'reverse') return <div className="binder-page is-reverse" />;
    if (ref < 0 || ref >= pageCount) {
      return (
        <div className="binder-page is-cover" style={{ fontSize: pw * 0.07 }}>
          {ref < 0 ? coverLabel : ''}
        </div>
      );
    }
    const pockets = renderPockets(ref);
    return (
      <div
        className="binder-page"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          fontSize: pw * (cols === 3 ? 0.032 : 0.044),
        }}
      >
        {pockets.map((node, k) => (
          <div
            key={k}
            className="pocket"
            style={{
              borderRightWidth: k % cols < cols - 1 ? 2 : 0,
              borderBottomWidth: Math.floor(k / cols) < rows - 1 ? 2 : 0,
            }}
          >
            {node}
          </div>
        ))}
        <div className="pointer-events-none absolute right-0 bottom-[0.1em] left-0 text-center text-[0.55em] opacity-50">
          p.{ref + 1}
        </div>
      </div>
    );
  };

  const restLeft: PageRef | null = spread ? 2 * s - 1 : null;
  const restRight: PageRef = spread ? 2 * s : cur;
  const leftRef = flip ? flip.left : restLeft;
  const rightRef = flip ? flip.right : restRight;

  const posLabel = spread
    ? [2 * s - 1, 2 * s]
        .filter((i) => i >= 0 && i < pageCount)
        .map((i) => i + 1)
        .join('-')
    : String(cur + 1);

  const vars = {
    '--pw': `${pw}px`,
    '--ph': `${ph}px`,
    '--g': `${g}px`,
    '--pad': `${pad}px`,
  } as CSSProperties;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={wrapRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        {width > 0 && (
          <div
            className={`binder-stage ${spread ? 'binder-spread' : 'binder-single'}`}
            style={vars}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          >
            <div className="binder-book">
              {spread && <div className="binder-slot">{renderPage(leftRef)}</div>}
              <div className="binder-slot">
                {renderPage(rightRef)}
                {flip && (
                  <div ref={leafRef} className="binder-leaf">
                    <div className="binder-face is-front">
                      {renderPage(flip.front)}
                      <div className="binder-shade" />
                    </div>
                    <div className="binder-face is-back">
                      {renderPage(flip.back)}
                      <div className="binder-shade" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="binder-rings" style={{ left: spread ? pad + pw : pad }}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="binder-ring" />
              ))}
            </div>
          </div>
        )}
      </div>
      <nav className="flex items-center justify-center gap-3 py-2" aria-label="ページ移動">
        <button
          type="button"
          onClick={() => startFlip(-1, true)}
          disabled={!canGo(-1)}
          className="grid size-11 place-items-center rounded-full bg-pink text-white disabled:opacity-35"
          aria-label="前のページ"
        >
          <Icon name="chevronLeft" />
        </button>
        <label className="relative flex min-w-24 items-center justify-center font-extrabold">
          <span aria-hidden="true">
            {posLabel} / {pageCount}
          </span>
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={cur}
            onChange={(e) => onPageChange(Number(e.target.value))}
            aria-label="ページを選ぶ"
          >
            {Array.from({ length: pageCount }, (_, i) => (
              <option key={i} value={i}>
                {i + 1} ページ
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => startFlip(1, true)}
          disabled={!canGo(1)}
          className="grid size-11 place-items-center rounded-full bg-pink text-white disabled:opacity-35"
          aria-label="次のページ"
        >
          <Icon name="chevronRight" />
        </button>
      </nav>
    </div>
  );
}

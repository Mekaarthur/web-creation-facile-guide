import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
  clear: () => void;
}

interface Props {
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
  backgroundColor?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ canvasProps, backgroundColor = 'white' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const empty = useRef(true);

    const fill = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Match canvas resolution to its rendered CSS size
      const { width, height } = canvas.getBoundingClientRect();
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
      }
      fill(canvas);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useImperativeHandle(ref, () => ({
      isEmpty: () => empty.current,
      toDataURL: (type = 'image/png') => canvasRef.current?.toDataURL(type) ?? '',
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        fill(canvas);
        empty.current = true;
      },
    }));

    const getXY = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
      canvas: HTMLCanvasElement,
    ) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      if ('touches' in e) {
        const t = e.touches[0];
        return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
      }
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    };

    const onStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      drawing.current = true;
      empty.current = false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { x, y } = getXY(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const onMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { x, y } = getXY(e, canvas);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111';
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onEnd = () => { drawing.current = false; };

    const { style, ...rest } = canvasProps ?? {};

    return (
      <canvas
        ref={canvasRef}
        {...rest}
        style={{ touchAction: 'none', cursor: 'crosshair', ...style }}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

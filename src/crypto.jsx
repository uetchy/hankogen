import ImageTracer from 'imagetracerjs';
import './styles.css';

const log = console.log;

async function main() {
  const [W, H] = [512, 512];
  const BOX = 16;
  const [LW, LH] = [W / BOX, H / BOX].map((d) => Math.floor(d));
  const [CW, CH] = [W / 2, H / 2].map((d) => Math.floor(d));

  const canvas = document.getElementById('app');
  canvas.width = W;
  canvas.height = H;
  const h = await hash('uetchy');
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.filter = 'blur(3px)';

  for (let i = 0; i < LW; i++) {
    for (let j = 0; j < LH; j++) {
      const f1 = h[0][j];
      const f2 = h[1][i];
      const [x, y] = [i * BOX, j * BOX];
      log(f2);
      if (f1 === 0 && f2 === 0) {
        // x
        // xx
        ctx.fillRect(x, y, BOX / 2, BOX);
        ctx.fillRect(x + BOX / 2, y + BOX / 2, BOX / 2, BOX / 2);
      } else if (f1 === 0 && f2 === 1) {
        // xx
        // x
        ctx.fillRect(x, y, BOX / 2, BOX);
        // ctx.fillRect(x + BOX / 2, y, BOX / 2, BOX / 2);
      } else if (f1 === 1 && f2 === 0) {
        //  x
        // xx
        // ctx.fillRect(x, y + BOX / 2, BOX / 2, BOX / 2);
        ctx.fillRect(x + BOX / 2, y, BOX / 2, BOX);
      } else {
        // xx
        //  x
        // ctx.fillRect(x, y, BOX / 2, BOX / 2);
        ctx.fillRect(x + BOX / 2, y, BOX / 2, BOX);
      }
    }
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(CW, CH, CH, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(CW, CH, CH - 4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.lineWidth = 4;
  ctx.stroke();

  var src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var dst = ctx.createImageData(canvas.width, canvas.height);

  for (var i = 0; i < src.data.length; i = i + 4) {
    var ret = src.data[i + 3] > 112;
    if (ret) {
      dst.data[i] = 255;
      dst.data[i + 1] = dst.data[i + 2] = 30;
    } else {
      dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = 255;
    }
    dst.data[i + 3] = 255;
  }
  ctx.putImageData(dst, 0, 0);
}

async function hash(data) {
  const f = data.slice(0, Math.floor(data.length / 2));
  const b = data.slice(Math.floor(data.length / 2));
  const fbuf = new TextEncoder('utf-8').encode(f);
  const bbuf = new TextEncoder('utf-8').encode(b);
  const hashBuf = await crypto.subtle.digest('sha-256', fbuf);
  const hashBuf2 = await crypto.subtle.digest('sha-256', bbuf);
  const barr = Array.from(new Uint8Array(hashBuf)).map((b) =>
    Math.floor(b / 128),
  );
  const barr2 = Array.from(new Uint8Array(hashBuf2)).map((b) =>
    Math.floor(b / 128),
  );
  return [barr, barr2];
}

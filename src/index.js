import ImageTracer from 'imagetracerjs';
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
  log(h[0]);
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

async function main2() {
  const canvas = document.getElementById('app');
  const ctx = canvas.getContext('2d');

  const [W, H] = [512, 512];
  const [CW, CH] = [W / 2, H / 2].map((d) => Math.floor(d));
  canvas.width = W;
  canvas.height = H;

  createStamp(ctx, '志摩', CW, CH, W, H);
  await generateDownloadLink(canvas);

  document.querySelector('#input').addEventListener('change', async (e) => {
    const newText = e.target.value;
    createStamp(ctx, newText, CW, CH, W, H);
    await generateDownloadLink(canvas);
  });
}

main2();

async function generateDownloadLink(canvas) {
  const svg = await traceImage(canvas);
  const blob = new Blob([svg], {type: 'image/svg+xml'});
  const link = URL.createObjectURL(blob);
  document.querySelector('#save').href = link;
  document.querySelector('#save').download = 'output.svg';
}

function createStamp(ctx, text, CW, CH, W, H) {
  ctx.clearRect(0, 0, W, H);
  fillVertText(ctx, CW, CH, text);
  cropWithCircle(ctx, CW, CH);
  drawStampEdge(ctx, CW, CH);
  binarizeCanvas(ctx, W, H);
}

function cropWithCircle(ctx, CW, CH) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(CW, CH, CH, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function traceImage(canvas) {
  const imgdata = ImageTracer.getImgdata(canvas);
  const svg = ImageTracer.imagedataToSVG(imgdata);
  return svg;
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

function fillVertText(ctx, x, y, text, kern = 5) {
  ctx.save();
  const size = 520 / text.length;
  const totalLen = size * text.length - kern * text.length;
  ctx.fillStyle = 'red';
  ctx.filter = 'blur(3px)';
  ctx.font = `${size}px serif`;
  let yOffset = y + -1 * (totalLen / 2) - 20;
  for (const i in text) {
    yOffset += size - kern;
    ctx.fillText(text[i], x - size / 2, yOffset);
  }
  ctx.restore();
}

function drawStampEdge(ctx, CW, CH) {
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.filter = 'blur(2px)';
  ctx.beginPath();
  ctx.arc(CW, CH, CH - 4, 0, Math.PI);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CW, CH, CH - 4, Math.PI, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function binarizeCanvas(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  const dest = ctx.createImageData(w, h);

  for (let i = 0; i < src.data.length; i += 4) {
    const ret = src.data[i + 3] > 112;
    if (ret) {
      dest.data[i] = 255;
      dest.data[i + 1] = dest.data[i + 2] = 30;
    } else {
      dest.data[i] = dest.data[i + 1] = dest.data[i + 2] = 255;
    }
    dest.data[i + 3] = 255;
  }

  ctx.putImageData(dest, 0, 0);
}

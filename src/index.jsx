import React from 'react';
import ReactDOM from 'react-dom';
import ImageTracer from 'imagetracerjs';
import filenamify from 'filenamify';
import styled from '@emotion/styled';
import {Pane, Button, TextInput} from 'evergreen-ui';
import {TwitterShareButton} from 'react-twitter-embed';
import './styles.css';

const [W, H] = [512, 512];
const [CW, CH] = [W / 2, H / 2].map((d) => Math.floor(d));

const Header = styled.header`
  display: flex;
  padding: 16px;
  align-items: center;

  @media screen and (max-width: 800px) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
`;

const App = () => {
  const [text, setText] = useDeferredState('志摩', 500);
  const [link, setLink] = React.useState('');
  const [isLoading, setLoading] = React.useState(true);
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = W;
    canvas.height = H;
    applyText();
  }, []);

  React.useEffect(() => {
    applyText();
  }, [text]);

  function changeText(e) {
    setLoading(true);
    setText(e.target.value);
  }

  async function applyText() {
    createStamp(canvasRef.current.getContext('2d'), text, CW, CH, W, H);
    await generateDownloadLink(canvasRef.current);
    setLoading(false);
  }

  async function generateDownloadLink(canvas) {
    const svg = await traceImage(canvas);
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const link = URL.createObjectURL(blob);
    setLink(link);
  }

  return (
    <Pane>
      <Header>
        <Pane flex={1} display="flex">
          <TextInput
            type="text"
            placeholder="任意の漢字をいれよう"
            onChange={changeText}
            flex={1}
            marginRight={16}
          />
        </Pane>
        <Button
          is="a"
          href={link}
          download={`${filenamify(text)}.svg`}
          appearance="primary"
          isLoading={isLoading}
          marginRight="16">
          {isLoading ? 'Baking' : 'Download as .svg'}
        </Button>
      </Header>
      <Pane
        display="flex"
        justifyContent="center"
        paddingBottom={50}
        paddingTop={50}>
        <canvas ref={canvasRef}></canvas>
      </Pane>
      <Pane display="flex" justifyContent="center">
        <TwitterShareButton url="https://hanko.netlify.com" />
      </Pane>
    </Pane>
  );
};

ReactDOM.render(<App />, document.querySelector('#app'));

function useDeferredState(initialValue = undefined, duration = 1000) {
  const [response, setResponse] = React.useState(initialValue);
  const [innerValue, setInnerValue] = React.useState(initialValue);

  React.useEffect(() => {
    const fn = setTimeout(() => {
      setResponse(innerValue);
    }, duration);

    return () => {
      clearTimeout(fn);
    };
  }, [duration, innerValue]);

  return [response, setInnerValue];
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

function fillVertText(ctx, x, y, text, kern = 5) {
  ctx.save();
  const size = 520 / text.length;
  const blur = Math.ceil(7 / text.length);
  const totalLen = size * text.length - kern * text.length;
  ctx.fillStyle = 'red';
  ctx.filter = `blur(${blur}px)`;
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

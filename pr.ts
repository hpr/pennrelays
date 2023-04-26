import WebSocket from 'ws';
import fs from 'fs';

const wsUrl = 'wss://s-usc1f-nss-2567.firebaseio.com/.ws?';
const ns = 'franklin-f56f3';
let requestCount = 1;

const ls: string = await new Promise((res) => {
  const ws = new WebSocket(
    wsUrl +
      new URLSearchParams({
        v: '5',
        ns,
      })
  );
  ws.on('message', (data) => {
    res(JSON.parse(data.toString()).d.d.s);
    ws.close();
  });
});
console.log(ls);

const ws = new WebSocket(
  wsUrl +
    new URLSearchParams({
      v: '5',
      ns,
      ls,
    })
);

let resolve = (_: unknown) => {};
let route = '';
const resp = (rt: string) =>
  new Promise((res) => {
    resolve = res;
    route = rt;
  });

let msg = '';
let completeData: any = undefined;
ws.on('message', (data) => {
  msg += data.toString();
  let m: Resp;
  try {
    m = JSON.parse(msg);
    msg = '';
    console.log('received', m, m?.d?.b?.p, route);
    if (m?.d?.b?.p === route) completeData = m;
    if (m?.d?.b?.s === 'ok') {
      resolve(completeData);
      completeData = undefined;
    }
  } catch {}
});

type Resp = {
  t: 'd';
  d: {
    a: 'd';
    b: {
      p?: string; // path / route
      s?: 'ok'; // status
      d: any; // data
    };
  };
};
const send = async (rt: string) => {
  ws.send(JSON.stringify({ t: 'd', d: { r: requestCount++, a: 'q', b: { p: rt, h: '' } } }));
  console.log('sending', rt);
  const r = (await resp(rt)) as Resp;
  return r?.d?.b?.d;
};

const log = (...args: any[]) => console.dir(args, { depth: null });

type MetaType = {
  ID: number;
  [k: string]: any;
};

ws.on('open', async () => {
  const metas = JSON.parse(fs.readFileSync('./meets.json', 'utf-8'));
  for (let meet = 1; meet <= 5527; meet++) {
    console.log(meet);
    if (metas[meet]) continue;
    const fname = `./events/${meet}.json`;
    if (fs.existsSync(fname)) continue;
    const Meta: MetaType = await send(`${meet}/Meta`);
    if (!Meta) {
      console.log('skipping');
      continue;
    }
    metas[meet] = Meta;
    if (Object.values(Meta).some((val) => (val + '').toLowerCase().match(/penn ?relays/))) {
      const MeetEvents = await send(`${meet}/MeetEvents`);
      fs.writeFileSync(fname, JSON.stringify({ Meta, MeetEvents }));
    }
    fs.writeFileSync('./meets.json', JSON.stringify(metas));
  }
});

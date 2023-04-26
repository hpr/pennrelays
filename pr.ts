import WebSocket from 'ws';

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

ws.on('message', (data) => {
  const m = JSON.parse(data.toString());
  console.log('received', m, m?.d?.b?.p, route);
  if (m?.d?.b?.p === route) resolve(m);
});

type Resp = {
  t: 'd';
  d: {
    a: 'd';
    b: {
      p: string;
      d: any;
    };
  };
};
const send = async (rt: string) => {
  ws.send(JSON.stringify({ t: 'd', d: { r: requestCount++, a: 'q', b: { p: rt, h: '' } } }));
  const r = await resp(rt) as Resp;
  return r.d?.b?.d;
};

ws.on('open', async () => {
  console.log(await send('5527/Meta'));
  console.dir(await send('5527/MeetEvents/101-1'), { depth: null });
});

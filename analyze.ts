import fs from 'fs';

function mergeMeets() {
  const pennRelays = {
    2017: 1211,
    2018: 1378,
    2019: 1665,
    2022: 4985,
    2023: 5527,
  };
  const relays = {};
  for (let year in pennRelays) {
    const meet = JSON.parse(fs.readFileSync(`./events/${pennRelays[year]}.json`, 'utf-8'));
    relays[year] = meet;
  }
  fs.writeFileSync('./pennrelays.json', JSON.stringify(relays));
}
// mergeMeets();

type Series = {
  [year: number]: {
    Meta: {
      ID: number;
      name: string;
    };
    MeetEvents: {
      [eventId: string]: {
        N: string; // event name
        T: string; // time
        S: string; // status
        ED: {
          [teamId: string]: {
            RRD: {
              [legId: number]: {
                L: number; // leg
                A: {
                  ID: number;
                  A: string; // team
                  LN: string; // name?
                  N: string; // name w/ space at front?
                };
              };
            };
            SPD: {
              [splitId: number]: {
                L: number; // leg
                CS: string; // cumulative split
                CSM: number; // cumulative numerical split
                LS?: string; // individual split
                TB: string; // cumulative exchange zone time?
                P: number; // place at end of split
                M: number; // movement (positive = moved forward X places, negative = moved backward X places)
              };
            };
          };
        };
      };
    };
  };
};
function getFrequents() {
  const series: Series = JSON.parse(fs.readFileSync('./pennrelays.json', 'utf-8'));
  const splitRecords = {};
  for (const year in series) {
    console.log(year);
    for (const eventId in series[year].MeetEvents) {
      const event = series[year].MeetEvents[eventId]
      for (const teamId in event.ED) {
        for (const legId in event.ED[teamId].RRD) {
          const leg = event.ED[teamId].RRD[legId];
          const split = Object.values(event.ED[teamId].SPD ?? {}).find((spd) => spd.L === leg.L);
          if (split) {
            const splitStr = split.LS ?? split.CS;
            const prevSplit = Object.values(event.ED[teamId].SPD).find((spd) => spd.L === leg.L - 1);
            const splitTime = split.CSM - (prevSplit?.CSM ?? 0);
            let eventName = event.N.replace(/ \(\d+\)$/, '');
            if (eventName.includes('Medley')) eventName += ` (Leg ${leg.L})`;
            const splitObj = {
              leg: split.L,
              team: leg.A.A,
              name: leg.A.LN,
              year,
              splitStr,
              splitTime,
              startPlace: prevSplit?.P ?? 'N/A',
              endPlace: split.P,
            };
            splitRecords[eventName] ??= splitObj;
            if (splitTime < splitRecords[eventName].splitTime) {
              splitRecords[eventName] = splitObj;
            }
          }
          // athletes[leg.A.ID] ??= [];
          // athletes[leg.A.ID]
        }
      }
    }
  }
  fs.writeFileSync('./stats/splitRecords.json', JSON.stringify(splitRecords, null, 2));
}
getFrequents();

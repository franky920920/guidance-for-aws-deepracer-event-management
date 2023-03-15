import { assign, createMachine, raise } from 'xstate';

export const stateMachine = createMachine({
  id: 'timekeeper',
  predictableActionArguments: true,
  preserveActionOrder: true,
  context: { raceTimeIsExpired: false, dnf: false },
  initial: 'ReadyToStartRace',
  states: {
    RaceReseted: {
      entry: ['resetRace', 'stopPublishOverlayInfo'],
      // on: {
      //   READY: 'ReadyToStartRace',
      //   END: 'RaceReseted',
      // },
      always: [{ target: 'ReadyToStartRace' }],
    },
    ReadyToStartRace: {
      entry: ['readyToStart', 'startPublishOverlayInfo'],
      on: {
        TOGGLE: 'RaceStarted',
        END: 'RaceReseted',
        CAPTURE_AUT_LAP: 'RaceStarted',
      },
    },
    RaceStarted: {
      initial: 'running',
      states: {
        running: {
          entry: ['startTimer', 'startPublishOverlayInfo', assign({ raceTimeIsExpired: false })],
          on: {
            TOGGLE: 'paused',
            EXPIRE: {
              actions: [assign({ raceTimeIsExpired: true })],
            },
            END: 'raceIsOver',
            CAPTURE_LAP: 'captureLap',
            CAPTURE_AUT_LAP: 'captureLap',
            DID_NOT_FINISH: {
              actions: [assign({ dnf: true }), raise('CAPTURE_LAP')], // TODO raise with param, then param is not propogated to capturelap
            },
          },
        },
        paused: {
          entry: ['pauseTimer', 'pausePublishOverlayInfo'],
          on: {
            TOGGLE: 'running',
            CAPTURE_AUT_LAP: 'running',
            END: 'raceIsOver',
          },
        },
        captureLap: {
          entry: ['captureLap'],
          exit: [assign({ dnf: false })],
          always: [
            { target: 'running', cond: (context) => !context.raceTimeIsExpired && !context.dnf },
            { target: 'paused', cond: (context) => !context.raceTimeIsExpired && context.dnf },
            { target: 'raceIsOver', cond: (context) => context.raceTimeIsExpired },
          ],
        },
        raceIsOver: {
          type: 'final',
        },
      },
      onDone: 'RaceIsOver',
    },
    RaceIsOver: {
      entry: ['pauseTimer', 'stopPublishOverlayInfo', 'endRace'],
      on: {
        END: 'RaceReseted',
        RESUME: 'RaceStarted.paused',
      },
    },
  },
});

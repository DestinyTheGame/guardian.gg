import { XMLHttpRequest } from 'xmlhttprequest';
import assume from 'assume';
import Guardian from './';

describe('Guardian.gg', function () {
  const gg = new Guardian({ XHR: XMLHttpRequest });

  const UVXlll = '4611686018460255011';
  const team = ['4611686018429196142', '4611686018437424676', '4611686018460255011'];

  describe('#userElo', function () {
    it('is a function', function () {
      assume(gg.userElo).is.a('function');
    });

    it('returns self', function () {
      assume(gg.userElo(UVXlll, () => {})).equals(gg);
    });

    it('retrieves user Elo', function (next) {
      gg.userElo(UVXlll, (err, data) => {
        assume(err).to.be.a('undefined');
        assume(data).is.a('array');

        const playlist = data[0];

        assume(playlist).is.a('object');
        assume(playlist.mode).is.a('number');
        assume(playlist.elo).is.a('number');
        assume(playlist.rank).is.a('number');

        next();
      });
    });
  });

  describe('#fireteam', function () {
    it('is a function', function () {
      assume(gg.fireteam).is.a('function');
    });

    it('returns self', function () {
      assume(gg.fireteam(UVXlll, 14, () => {})).equals(gg);
    });

    it('returns the last known fireteam', function (next) {
      gg.fireteam(UVXlll, 14, (err, data) => {
        assume(err).to.be.a('undefined');

        assume(data).is.a('array');
        assume(data).has.length(3);

        console.log(data);

        const me = data.filter((member) => {
          return member.name === 'UVXlll';
        })[0];

        assume(me).is.a('object');
        assume(me.elo).is.a('number');

        next();
      });
    });
  });

  describe('#seasons', function () {
    it('is a function', function () {
      assume(gg.seasons).is.a('function');
    });

    it('returns self', function () {
      assume(gg.seasons(UVXlll, () => {})).equals(gg);
    });

    it('retrieves users previous season Elo', function (next) {
      gg.seasons(UVXlll, (err, data) => {
        assume(err).to.be.a('undefined');
        assume(data).is.a('array');

        const playlist = data[0];

        assume(playlist).is.a('object');
        assume(playlist.mode).is.a('number');
        assume(playlist.elo).is.a('number');
        assume(playlist.rank).is.a('number');

        next();
      });
    });
  });

  describe('#teamElo', function () {
    it('is a function', function () {
      assume(gg.teamElo).is.a('function');
    });

    it('returns self', function () {
      assume(gg.teamElo(team, () => {})).equals(gg);
    });

    it('returns team information', function (next) {
      gg.teamElo(team, (err, data) => {
        assume(err).to.be.a('undefined');
        assume(data).is.a('object');

        const me = data[UVXlll];
        assume(me).is.a('object');
        assume(me.elo).is.a('number');

        next();
      });
    });
  });
});

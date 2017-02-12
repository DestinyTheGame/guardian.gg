# guardian.gg

[![Greenkeeper badge](https://badges.greenkeeper.io/DestinyTheGame/guardian.gg.svg)](https://greenkeeper.io/)

The `guardian.gg` module implements the API that is exposed by the `guardian.gg`
website. This allows you to retrieve stats such as Elo from site.

## Installation

The module is released in the public npm registry and can be installed by
running:

```
npm install --save guardian.gg
```

## API

The module is exposed as ES6 module and can be imported by any babel transformed
module using:

```js
import Guardian from 'guardian.gg';

const gg = new Guardian();
```

The following methods are available on the API:

### userElo

Get the user Elo. The function assumes 2 arguments:

- The membership id of the user.
- Completion callback.

```js
gg.userElo('24098019831', (err, data) => {

});
```

### seasons

Get previous season Elo. The function assumes 2 arguments:

- The membership id of the user.
- Completion callback.

```js
gg.seasons('24098019831', (err, data) => {

});
```

### teamElo

Get Elo rankings for a given team. The function assumes 2 arguments:

- Array of membership id of the team.
- Completion callback.

```js
gg.teamElo(['24098019831'], (err, data) => {

});
```

### fireteam 

Get fireteam for a given game mode. The function assumes 3 arguments:

- The membership id of the user.
- Game mode id
- Completion callback.

```js
gg.fireteam('24098019831', 14, (err, data) => {

});
```

### team

Get team information. The function assumes 2 arguments:

- Array of membership id of the team.
- Completion callback.

```js
gg.team(['24098019831'], (err, data) => {

});
```

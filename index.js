import EventEmitter from 'eventemitter3';
import diagnostics from 'diagnostics';
import failure from 'failure';
import Queue from 'queueback';
import URL from 'url-parse';
import prop from 'propget';

//
// Setup our debug utility.
//
const debug = diagnostics('guardian.gg');

/**
 * Guardian.gg API interactions.
 *
 * Options:
 *
 * - api:       Location of the API server that we're requesting.
 * - timeout:   Maximum request timeout.
 *
 * @constructor
 * @param {Object} options Configuration.
 * @public
 */
export default class Guardian extends EventEmitter {
  constructor(options = {}) {
    super();

    this.api = 'https://api.guardian.gg/';
    this.timeout = 30000;                     // API timeout.

    //
    // These properties should NOT be overridden by the supplied options object.
    //
    this.on('error', debug);
    this.queue = new Queue();
    this.XHR = options.XHR || global.XMLHttpRequest;
  }

  /**
   * Send a request over the API.
   *
   * @param {Object} options The request options.
   * @param {Function} fn Completion callback.
   * @returns {Guardian}
   * @private
   */
  send(options, fn) {
    const template = options.template || {};
    const using = Object.assign({ method: 'GET' }, options || {});
    const url =  this.format(using.url, template);

    //
    // Small but really important optimization: For GET requests the last thing
    // we want to do is to make API calls that we've just send and are being
    // processed as we speak. We have no idea where the consumer is making API
    // calls from so it can be that they are asking for the same data from
    // multiple locations in their code. We want to group these API requests.
    //
    const method = using.method;
    const href = url.href;

    if (this.queue.add(method, href, fn)) return;

    const xhr = new this.XHR();

    xhr.open(method, href, true);
    xhr.timeout = this.timeout;

    xhr.onload = () => {
      if (xhr.status !== 200) {
        return this.queue.run(method, href, failure('There seems to be problem with the guardian.gg API', {
          code: xhr.status,
          action: 'retry',
          text: xhr.text,
          using: using,
          body: ''
        }));
      }

      let data = xhr.response || xhr.responseText;

      try { data = JSON.parse(data); }
      catch (e) {
        return this.queue.run(method, href, failure('Unable to parse the JSON response from the guardian.gg API', {
          code: xhr.status,
          text: xhr.text,
          action: 'rety',
          using: using,
          body: data
        }));
      }

      //
      // Handle API based errors. It seems that error code 1 is usually returned
      // for valid requests while an ErrorCode of 0 was expected to be save we're
      // going to assume that 0 and 1 are both valid values.
      //
      if (data.statusCode && data.statusCode !== 200) {
        debug('we received an error code (%s) from the guardian.gg api for %s', data.statusCode, url.href);

        //
        // At this point we don't really know what kind of error we received so we
        // should fail hard and return a new error object.
        //
        debug('received an error from the api: %s', data.statusCode);
        return this.queue.run(method, url, failure('Received incorrect statusCode '+ data.statusCode, data));
      }

      //
      // Pre-filter the data. The data structure that is returned from the
      // guardian.gg API is pretty darn inconsistent. Sometimes we get an array
      // of results and other times we get an object with a data property and
      // a custom statusCode property. We want to normalize these edge cases.
      //
      if (data.statusCode && 'data' in data) {
        data = data.data;
      }

      //
      // Check if we need filter the data down using our filter property.
      //
      if (!using.filter) return this.queue.run(method, url, undefined, data);

      this.queue.run(method, url, undefined, prop(data, using.filter));
    };

    xhr.send(using.body);

    return this;
  }

  /**
   * Simple yet effective URL formatter.
   *
   * @param {String|Array} endpoint The API endpoint that we're trying to hit.
   * @param {Object} data Additional data that needs to be transformed.
   * @returns {URL} Created URL instance.
   * @private
   */
  format(endpoint, data) {
    endpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    //
    // Replace our template or "place holders" with our supplied data.
    //
    let api = this.api + endpoint;

    for(let prop in data) {
      api = api.replace(new RegExp('{'+ prop +'}','g'), data[prop]);
    }

    const url = new URL(api);

    //
    // Final check, we need to make sure that the pathname has a leading slash
    // so we don't have to follow potential redirects as all documented API
    // calls have the leading slash.
    //
    if (url.pathname.charAt(url.pathname.length - 1) !== '/') {
      url.set('pathname', url.pathname + '/');
    }

    return url;
  }

  /**
   * Get the users ELO ratings.
   *
   * @param {String} id Membership Id
   * @param {Function} fn Completion callback.
   * @returns {Guardian} Chaining.
   * @public
   */
  userElo(id, fn) {
    return this.send({
      url: 'elo/{membershipId}',
      template: {
        membershipId: id
      }
    }, fn);
  }

  /**
   * Get previous season ELO's.
   *
   * @param {String} id Membership Id
   * @param {Function} fn Completion callback.
   * @returns {Guardian} Chaining.
   * @public
   */
  seasons(id, fn) {
    return this.send({
      url: 'v2/players/{membershipId}/seasons',
      template: {
        membershipId: id
      }
    }, fn);
  }

  /**
   * Get ELO for a given team.
   *
   * @param {Array} team Membership Ids of the team.
   * @param {Function} fn Completion callback.
   * @returns {Guardian} Chaining.
   * @public
   */
  teamElo(team, fn) {
    return this.send({
      url: 'dtr/elo?alpha={teamArray}',
      filter: 'players',
      template: {
        teamArray: team.join(',')
      }
    }, fn);
  }

  /**
   * Get fireteam for a given mode.
   *
   * @param {String} id Membership Id
   * @param {Function} fn Completion callback.
   * @returns {Guardian} Chaining.
   * @public
   */
  fireteam(id, mode = 14, fn) {
    return this.send({
      url: 'fireteam/{mode}/{membershipId}',
      template: {
        membershipId: id,
        mode: mode
      }
    }, fn);
  }

  /**
   * Get team information.
   *
   * @param {Array} ids Membership Ids of the team.
   * @param {Function} fn Completion callback.
   * @returns {Guardian} Chaining.
   * @public
   */
  team(ids, fn) {
    return this.send({
      url: 'dtr/{membershipIdArray}',
      template: {
        membershipIdArray: ids.join(',')
      }
    }, fn);
  }
}

/* eslint no-unused-vars:off */
'use strict'

const { expect } = require('chai')
const parse = require('./parse')
const { PARSERS } = require('../index')
const builtinParsers = require('../parsers')

describe('parse() with custom tag parsers', function () {
  function sample () {
    /**
     * @tag {type} name description
     */
    var a
  }

  it('should use `opts.parsers`', function () {
    const parsers = [
      function everything (str) {
        return {
          source: str,
          data: {
            tag: 'tag',
            type: 'type',
            name: 'name',
            optional: false,
            description: 'description'
          }
        }
      }
    ]

    expect(parse(sample, { parsers })[0])
      .to.eql({
        line: 1,
        description: '',
        source: '@tag {type} name description',
        tags: [{
          tag: 'tag',
          type: 'type',
          name: 'name',
          description: 'description',
          optional: false,
          source: '@tag {type} name description',
          line: 2
        }]
      })
  })

  it('should use `opts.parsers` with positions', function () {
    const parsers = [
      function everything (str) {
        return {
          source: str,
          data: {
            tag: 'tag',
            type: 'type',
            name: 'name',
            optional: false,
            description: 'description',
            positions: {
              posStart: 10,
              posEnd: 15,
              partLength: 5
            }
          }
        }
      }
    ]

    expect(parse(sample, { parsers })[0])
      .to.eql({
        line: 1,
        description: '',
        source: '@tag {type} name description',
        tags: [{
          tag: 'tag',
          type: 'type',
          name: 'name',
          description: 'description',
          optional: false,
          source: '@tag {type} name description',
          line: 2,
          positions: {
            posStart: 10,
            posEnd: 15,
            partLength: 5
          }
        }]
      })
  })

  it('should merge parsers result', function () {
    const parsers = [
      function parser1 (str) {
        return {
          source: '',
          data: { tag: 'tag' }
        }
      },
      function parser2 (str) {
        return {
          source: '',
          data: { type: 'type' }
        }
      },
      function parser3 (str) {
        return {
          source: '',
          data: {
            name: 'name',
            description: 'description'
          }
        }
      }
    ]

    expect(parse(sample, { parsers })[0])
      .to.eql({
        line: 1,
        description: '',
        source: '@tag {type} name description',
        tags: [{
          tag: 'tag',
          type: 'type',
          name: 'name',
          description: 'description',
          optional: false,
          source: '@tag {type} name description',
          line: 2
        }]
      })
  })

  it('should catch parser exceptions and populate `errors` field', function () {
    const parsers = [
      function parser1 (str) {
        return {
          source: '',
          data: { tag: 'tag' }
        }
      },
      function parser2 (str) {
        throw new Error('error 1')
      },
      function parser3 (str) {
        throw new Error('error 2')
      },
      function parser4 (str) {
        return {
          source: '',
          data: { name: 'name' }
        }
      }
    ]

    expect(parse(sample, { parsers })[0])
      .to.eql({
        line: 1,
        description: '',
        source: '@tag {type} name description',
        tags: [{
          tag: 'tag',
          type: '',
          name: 'name',
          description: '',
          optional: false,
          source: '@tag {type} name description',
          errors: [
            'parser2: error 1',
            'parser3: error 2'
          ],
          line: 2
        }]
      })
  })

  it('should catch parser exceptions and populate `errors` field (with built-in `parse_type`)', function () {
    const parsers = [
      function parser1 (str) {
        throw new Error('error 1')
      },
      builtinParsers.parse_type,
      function parser3 (str) {
        throw new Error('error 2')
      },
      function parser4 (str) {
        return {
          source: '',
          data: { name: 'name' }
        }
      }
    ]

    expect(parse(sample, { parsers })[0])
      .to.eql({
        line: 1,
        description: '',
        source: '@tag {type} name description',
        tags: [{
          type: '',
          name: 'name',
          description: '',
          optional: false,
          source: '@tag {type} name description',
          errors: [
            'parser1: error 1',
            'parser3: error 2'
          ],
          line: 2
        }]
      })
  })

  it('should allow custom parsers to skip trailing whitespace', function () {
    const typeParsedInfo = PARSERS.parse_type(' ', {})

    expect(typeParsedInfo).to.eql(null)
  })

  it('should allow `parse_tag` parser to throw upon bad tag', function () {
    expect(() => {
      PARSERS.parse_tag('@')
    }).to.throw(Error, 'Invalid `@tag`, missing @ symbol')
  })
})

/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const DataConversion = require('../../utils/DataConversion');
const profileTimeline = require('./_data/profileTimeline.json');
const profileTimelineNoCursor = require('./_data/profileTimeline_noCursor.json');

describe('DataConversion Utility', () => {
  describe('.getCursorFromTimeline', () => {
    it('returns the cursor from a timeline object', () => {
      const cursor = DataConversion.getCursorFromTimeline(profileTimeline);
      expect(cursor).to.eql('HBaOwL65tq+AiCEAAA==');
    });

    it('returns null, when no cursor was found', () => {
      const cursor = DataConversion.getCursorFromTimeline(profileTimelineNoCursor);
      expect(cursor).to.be.null;
    });
  });
});

/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const DataConversion = require('../../utils/DataConversion');
const profileTimeline = require('./_data/profileTimeline.json');
const profileTimelineNoCursor = require('./_data/profileTimeline_noCursor.json');
const showMoreInstructions = require('./_data/showMoreInstructions.json');
const noShowMoreInstructions = require('./_data/noShowMoreInstructions.json');
const showMoreAbusiveInstructions = require('./_data/showMoreAbusiveInstructions.json');
const { testProps } = require('../utils');

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

  describe('.getShowMoreCursor', () => {
    it('finds the lowQuality ShowMore cursor in a timeline\'s instructions', () => {
      const showMoreCursor = DataConversion.getShowMoreCursor(showMoreInstructions);
      testProps(showMoreCursor, {
        cursor: 'LBkGJQQRAAA=',
        type: 'low'
      });
    });
    it('finds the abusiveQuality ShowMore cursor in a timeline\'s instructions', () => {
      const showMoreCursor = DataConversion.getShowMoreCursor(showMoreAbusiveInstructions);
      testProps(showMoreCursor, {
        cursor: 'LBkWjIC17fDVxYshJQYRAAA=',
        type: 'abusive'
      });
    });
    it('returns null, if no ShowMore cursor is found', () => {
      const showMoreCursor = DataConversion.getShowMoreCursor(noShowMoreInstructions);
      expect(showMoreCursor).to.be.null;
    });
  });
});

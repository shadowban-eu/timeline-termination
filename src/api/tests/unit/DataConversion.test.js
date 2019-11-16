/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const DataConversion = require('../../utils/DataConversion');
const profileTimeline = require('./_data/profileTimeline.json');
const profileTimelineNoCursor = require('./_data/profileTimeline_noCursor.json');
const showMoreInstructions = require('./_data/showMoreInstructions.json');
const noShowMoreInstructions = require('./_data/noShowMoreInstructions.json');

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
    it('finds the ShowMore cursor in a timeline\'s instructions', () => {
      const showMoreCursor = DataConversion.getShowMoreCursor(showMoreInstructions);
      expect(showMoreCursor).to.eql('LBkGJQQRAAA=');
    });
    it('returns empty string, if no ShowMore cursor is found', () => {
      const showMoreCursor = DataConversion.getShowMoreCursor(noShowMoreInstructions);
      expect(showMoreCursor).to.eql('');
    });
  });
});

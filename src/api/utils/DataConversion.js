const find = require('lodash.find');

class DataConversion {
  static getCursorFromTimeline(timelineObject) {
    const { entries } = timelineObject.instructions[0].addEntries;
    const bottomCursor = find(entries, entry => entry.entryId.startsWith('cursor-bottom'));
    return bottomCursor
      ? bottomCursor.content.operation.cursor.value
      : null;
  }
}

module.exports = DataConversion;

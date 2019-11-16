const find = require('lodash.find');

class DataConversion {
  static getCursorFromTimeline(timelineObject) {
    const { entries } = timelineObject.instructions[0].addEntries;
    const bottomCursor = find(entries, entry => entry.entryId.startsWith('cursor-bottom'));
    return bottomCursor
      ? bottomCursor.content.operation.cursor.value
      : null;
  }

  static getShowMoreCursor(instructions) {
    const { addEntries } = instructions.find(instruction => !!instruction.addEntries);
    const showMore = addEntries.entries.find(entry => entry.entryId.startsWith('cursor-showMoreThreads'));
    return showMore ? showMore.content.operation.cursor.value : '';
  }
}

module.exports = DataConversion;

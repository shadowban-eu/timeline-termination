class UserObject {
  constructor({
    id_str: id,
    screen_name: screenName,
    protected: isProtected,
    suspended,
    deleted
  }) {
    this.id = id;
    this.screenName = screenName;
    this.protected = isProtected;
    this.suspended = suspended;
    this.deleted = deleted;
  }
}

module.exports = UserObject;

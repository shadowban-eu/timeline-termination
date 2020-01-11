class UserObject {
  constructor({
    id_str: id,
    screen_name: screenName,
    protected: isProtected,
    suspended
  }) {
    this.id = id;
    this.screenName = screenName;
    this.protected = isProtected;
    this.suspended = suspended;
  }
}

module.exports = UserObject;

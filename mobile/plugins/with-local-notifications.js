const { withEntitlementsPlist } = require('expo/config-plugins');

// Event reminders are scheduled on-device and do not use APNs.
module.exports = (config) => withEntitlementsPlist(config, (mod) => {
  delete mod.modResults['aps-environment'];
  return mod;
});

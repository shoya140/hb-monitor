module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'Heartbeat Monitor',
        appId: 'io.shoya.hb-monitor',
        mac: {
          icon: 'src/assets/icon.icns'
        },
        win: {
          icon: 'src/assets/icon.ico'
        }
      }
    }
  }
}

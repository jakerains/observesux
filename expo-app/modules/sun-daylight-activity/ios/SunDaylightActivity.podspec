Pod::Spec.new do |s|
  s.name           = 'SunDaylightActivity'
  s.version        = '1.0.0'
  s.summary        = 'Native Live Activity bridge for the Siouxland daylight tracker'
  s.description    = 'Starts, stops, and inspects the Sun & Daylight Live Activity from Expo.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

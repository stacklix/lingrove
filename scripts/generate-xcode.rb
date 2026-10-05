require 'xcodeproj'
root = File.expand_path('..', __dir__)
path = File.join(root, 'ios/Lingrove.xcodeproj')
project = Xcodeproj::Project.new(path)
target = project.new_target(:application, 'Lingrove', :ios, '17.0')
group = project.main_group.new_group('Lingrove', 'Lingrove')
Dir.glob(File.join(root, 'ios/Lingrove/**/*.swift')).sort.each do |file|
  relative = file.delete_prefix(File.join(root, 'ios/Lingrove/'))
  target.source_build_phase.add_file_reference(group.new_file(relative))
end
resources = group.new_group('Resources', 'Resources')
%w[HostConfig.json BuiltinModules Assets.xcassets].each do |name|
  ref = resources.new_file(name)
  ref.last_known_file_type = 'folder' if name == 'BuiltinModules'
  target.resources_build_phase.add_file_reference(ref) unless name == 'BuiltinModules'
end
embed = target.new_shell_script_build_phase('Build and Embed Child Apps')
embed.shell_script = '"/bin/sh" "$SRCROOT/../scripts/embed-ios-modules.sh"'
embed.always_out_of_date = '1'
embed.output_paths = ['$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/BuiltinModules']
target.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'me.stackli.lingrove', 'SWIFT_VERSION' => '5.0',
    'ASSETCATALOG_COMPILER_APPICON_NAME' => 'AppIcon',
    'ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME' => 'AccentColor',
    'INFOPLIST_KEY_CFBundleDisplayName' => 'Lingrove', 'INFOPLIST_KEY_CFBundleName' => 'Lingrove',
    'GENERATE_INFOPLIST_FILE' => 'YES', 'INFOPLIST_KEY_UILaunchScreen_Generation' => 'YES',
    'INFOPLIST_KEY_UIApplicationSceneManifest_Generation' => 'YES',
    'INFOPLIST_KEY_UISupportedInterfaceOrientations' => 'UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
    'INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad' => 'UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
    'TARGETED_DEVICE_FAMILY' => '1,2', 'MARKETING_VERSION' => '1.3.0', 'CURRENT_PROJECT_VERSION' => '1',
    'CODE_SIGN_STYLE' => 'Automatic', 'ENABLE_USER_SCRIPT_SANDBOXING' => 'NO'
  })
end
ui = project.new_target(:ui_test_bundle, 'LingroveUITests', :ios, '17.0')
ui.add_dependency(target)
tests = project.main_group.new_group('UITests', 'UITests')
ui.source_build_phase.add_file_reference(tests.new_file('LingroveUITests.swift'))
ui.build_configurations.each do |config|
  config.build_settings.merge!({'SWIFT_VERSION'=>'5.0','GENERATE_INFOPLIST_FILE'=>'YES','PRODUCT_BUNDLE_IDENTIFIER'=>'me.stackli.lingrove.uitests','TEST_TARGET_NAME'=>'Lingrove','CODE_SIGN_STYLE'=>'Automatic'})
end
unit = project.new_target(:unit_test_bundle, 'LingroveRuntimeTests', :ios, '17.0')
unit.add_dependency(target)
runtime_tests = project.main_group.new_group('RuntimeTests', 'RuntimeTests')
unit.source_build_phase.add_file_reference(runtime_tests.new_file('RuntimeTests.swift'))
unit.build_configurations.each do |config|
  config.build_settings.merge!({'SWIFT_VERSION'=>'5.0','GENERATE_INFOPLIST_FILE'=>'YES','PRODUCT_BUNDLE_IDENTIFIER'=>'me.stackli.lingrove.runtime-tests','TEST_HOST'=>'$(BUILT_PRODUCTS_DIR)/Lingrove.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/Lingrove','BUNDLE_LOADER'=>'$(TEST_HOST)','CODE_SIGN_STYLE'=>'Automatic'})
end
project.build_configuration_list.default_configuration_name = 'Debug'
target.build_configuration_list.default_configuration_name = 'Debug'
target.build_configurations.find { |config| config.name == 'Debug' }.build_settings['INFOPLIST_FILE'] = 'Lingrove/Resources/DebugInfo.plist'
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(ui)
scheme.add_test_target(unit)
scheme.set_launch_target(target)
# Xcode 26 queue backtrace injection crashes at startup on affected iOS 27 betas.
scheme.launch_action.xml_element.attributes['queueDebuggingEnableBacktraceRecording'] = 'NO'
scheme.test_action.xml_element.attributes['queueDebuggingEnableBacktraceRecording'] = 'NO'
scheme.archive_action.build_configuration = 'Release'
scheme.save_as(path, 'Lingrove', true)
puts path

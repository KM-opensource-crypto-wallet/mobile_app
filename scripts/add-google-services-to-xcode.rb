#!/usr/bin/env ruby

# =============================================================================
# Add GoogleService-Info.plist to Xcode project targets
# Uses xcodeproj gem (installed with CocoaPods)
# =============================================================================

require 'xcodeproj'

# Configuration
PROJECT_PATH = File.expand_path('../../ios/coinswallet.xcodeproj', __FILE__)
TARGETS = {
  'coinswallet' => 'dokwallet/GoogleService-Info.plist',
  'kimlwallet' => 'kimlwallet/GoogleService-Info.plist'
}

puts "Opening Xcode project..."
project = Xcodeproj::Project.open(PROJECT_PATH)

TARGETS.each do |target_name, plist_relative_path|
  puts "\nProcessing target: #{target_name}"

  # Find the target
  target = project.targets.find { |t| t.name == target_name }
  unless target
    puts "  ⚠️  Target '#{target_name}' not found, skipping..."
    next
  end

  # Check if file already exists in project
  plist_path = plist_relative_path
  existing_ref = project.files.find { |f| f.path == plist_path }

  if existing_ref
    puts "  ✓ GoogleService-Info.plist already in project"
    file_ref = existing_ref
  else
    # Find the target's group
    group_name = target_name == 'coinswallet' ? 'dokwallet' : 'kimlwallet'
    group = project.main_group.find_subpath(group_name, false)

    unless group
      # Create the group if it doesn't exist
      puts "  Creating group: #{group_name}"
      group = project.main_group.new_group(group_name, group_name)
    end

    # Add file reference
    puts "  Adding GoogleService-Info.plist to project..."
    file_ref = group.new_reference('GoogleService-Info.plist')
    file_ref.last_known_file_type = 'text.plist.xml'
  end

  # Check if file is in resources build phase
  resources_phase = target.resources_build_phase
  already_in_build = resources_phase.files.any? { |f| f.file_ref == file_ref }

  if already_in_build
    puts "  ✓ Already in Resources build phase"
  else
    puts "  Adding to Resources build phase..."
    resources_phase.add_file_reference(file_ref)
  end
end

puts "\nSaving project..."
project.save

puts "✅ Done! GoogleService-Info.plist added to all targets."

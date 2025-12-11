# Pricefox Verification Test

Feature: Verify Pricefox website availability
  As a user
  I want to visit Pricefox.gr
  So that I can ensure the platform is online

  Scenario: Visit the Pricefox homepage
    Given I open the URL "https://www.pricefox.gr"
    Then the page title should contain "Pricefox"

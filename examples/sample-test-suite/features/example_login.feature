# Example Login Test

Feature: Example login test on a real website
  As a user
  I want to verify that the login page loads correctly
  So that I can ensure the UI is reachable

  Scenario: Visit the login page of a public site
    Given I open the URL "https://example.com"
    Then the page title should contain "Example Domain"

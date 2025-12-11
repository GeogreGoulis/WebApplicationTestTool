# Sample Feature File for WATT
# This file demonstrates how to write BDD test scenarios in Gherkin syntax

@authentication @smoke
Feature: User Login
  As a registered user
  I want to log into the application
  So that I can access my account and personal data

  Background:
    Given I am on the login page
    And I clear any existing session

  # ============================================
  # POSITIVE TEST SCENARIOS
  # ============================================

  @positive @critical
  Scenario: Successful login with valid credentials
    When I enter username "data:users.validUser.email"
    And I enter password "data:users.validUser.password"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see welcome message containing "data:users.validUser.displayName"
    And I should see the user avatar

  @positive @data-driven
  Scenario Outline: Login with different user roles
    When I enter username "<email>"
    And I enter password "<password>"
    And I click the login button
    Then I should be redirected to "<expectedPage>"
    And I should see role indicator "<role>"

    Examples:
      | email                       | password                      | expectedPage      | role          |
      | data:users.admin.email      | data:users.admin.password     | /admin/dashboard  | Administrator |
      | data:users.manager.email    | data:users.manager.password   | /manager/overview | Manager       |
      | data:users.standard.email   | data:users.standard.password  | /home             | User          |

  @positive @remember-me
  Scenario: Login with Remember Me option
    When I enter username "data:users.validUser.email"
    And I enter password "data:users.validUser.password"
    And I check the "Remember me" checkbox
    And I click the login button
    Then I should be redirected to the dashboard
    And a persistent session cookie should be created

  # ============================================
  # NEGATIVE TEST SCENARIOS
  # ============================================

  @negative @validation
  Scenario: Login with invalid email format
    When I enter username "invalid-email-format"
    And I enter password "anypassword"
    And I click the login button
    Then I should see error message "data:errors.invalidEmailFormat"
    And I should remain on the login page

  @negative @validation
  Scenario: Login with incorrect password
    When I enter username "data:users.validUser.email"
    And I enter password "wrongpassword123"
    And I click the login button
    Then I should see error message "data:errors.invalidCredentials"
    And I should remain on the login page
    And the password field should be cleared

  @negative @validation
  Scenario: Login with empty credentials
    When I leave the username field empty
    And I leave the password field empty
    And I click the login button
    Then I should see error message "data:errors.requiredFields"
    And I should remain on the login page

  @negative @security
  Scenario: Login with non-existent user
    When I enter username "nonexistent@example.com"
    And I enter password "anypassword"
    And I click the login button
    Then I should see error message "data:errors.invalidCredentials"
    And the error message should not reveal if the email exists

  @negative @security @brute-force
  Scenario: Account lockout after multiple failed attempts
    Given I have failed login 4 times with "data:users.validUser.email"
    When I enter username "data:users.validUser.email"
    And I enter password "wrongpassword"
    And I click the login button
    Then I should see error message "data:errors.accountLocked"
    And the account should be locked for "data:security.lockoutDuration" minutes

  # ============================================
  # EDGE CASES
  # ============================================

  @edge-case
  Scenario: Login with special characters in password
    When I enter username "data:users.specialChars.email"
    And I enter password "data:users.specialChars.password"
    And I click the login button
    Then I should be redirected to the dashboard

  @edge-case @unicode
  Scenario: Login with unicode characters in display name
    When I enter username "data:users.unicode.email"
    And I enter password "data:users.unicode.password"
    And I click the login button
    Then I should see welcome message containing "data:users.unicode.displayName"

  # ============================================
  # SESSION MANAGEMENT
  # ============================================

  @session
  Scenario: Session timeout handling
    Given I am logged in as "data:users.validUser.email"
    And my session has expired
    When I try to access a protected page
    Then I should be redirected to the login page
    And I should see message "data:errors.sessionExpired"

  @session
  Scenario: Prevent concurrent logins
    Given I am logged in as "data:users.validUser.email" on another device
    When I enter username "data:users.validUser.email"
    And I enter password "data:users.validUser.password"
    And I click the login button
    Then I should see warning about existing session
    And I should be able to choose to continue or cancel

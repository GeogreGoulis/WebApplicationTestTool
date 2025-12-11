# Pricefox Car Insurance Navigation Test
Feature: Pricefox Car Insurance Quote Flow
  As a user
  I want to get a car insurance quote
  So that I can see available insurance packages

  Scenario: Complete Car Insurance Quote Flow
    # 1. Navigation & Cookies
    Given I open the Pricefox homepage
    When I accept all cookies if prompted
    And I click on "Ασφάλεια Αυτοκινήτου" icon
    Then I should be on the car insurance page
    # 2. Car Plate Entry
    When I enter car plate "IMB4895"
    Then I should be redirected to the next step
    # 3. Vehicle Details (Temporarily Disabled)
    When I select vehicle type "Επιβατικό ΙΧ"
    And I select make "Seat"
    And I set first registration date "01/2008"
    And I click Next
    Then I should see the next step

# Pricefox Website Navigation Tests
Feature: Pricefox Navigation
  As a user
  I want to navigate the Pricefox website
  So that I can access insurance services

  Scenario: Navigate to Car Insurance page
    Given I browse "<baseUrl>"
    When I wait for the cookies pop-up
    And I click on "<cookieConsent.buttonText>" on the cookies pop-up
    And I click on the button that says "<navigation.carInsuranceButton>"
    Then I should be on the car insurance page

  Scenario: Enter car plate and compare
    When I set "<vehicle.plate>" as car plate
    And I click on the button "<buttons.compare>"
    Then I should be redirected to the next page

  Scenario: Enter vehicle details
    When I set "<fieldLabels.vehicleCategory>" to "<vehicle.category>"
    And I set "<fieldLabels.make>" to "<vehicle.make>"
    And I set "<fieldLabels.registrationDate>" to "<vehicle.registrationDate>"
    And I click on the button "<buttons.next>"
    Then I should be redirected to the next page

  Scenario: Enter vehicle specifications
    When I set "<fieldLabels.model>" to "<vehicle.model>"
    And I set "<fieldLabels.fuelType>" to "<vehicle.fuelType>"
    And I set "<fieldLabels.cubicCapacity>" to "<vehicle.cubicCapacity>"
    And I set "<fieldLabels.modelVersion>" to "<vehicle.modelVersion>"
    And I click on the button "<buttons.next>"
    Then I should be redirected to the next page

  Scenario: Enter driver information
    When I set "<fieldLabels.birthDate>" to "<driver.birthDate>"
    And I set "<fieldLabels.licenseYear>" to "<driver.licenseYear>"
    And I set "<fieldLabels.postalCode>" to "<driver.postalCode>"
    And I click on the button "<buttons.next>"
    Then I should be redirected to the next page

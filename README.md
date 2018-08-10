# Braintree Hosted Fields Challenge

An example Braintree Hosted Fields integration for Node in the Express framework. Based on the repo located here - https://github.com/braintree/braintree_express_example

## Setup Instructions

1. Install packages:

   ```sh
   npm install
   ```

2. Enter your sandbox API credentials into the .env file

3. Start the server:

   ```sh
   npm start
   ```

   By default, this runs the app on port `3000`. You can configure the port by setting the environmental variable `PORT`.

4. Make a transaction using test card data found here - https://developers.braintreepayments.com/guides/credit-cards/testing-go-live/node

5. Test out error handling by trying an invalid card number

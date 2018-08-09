'use strict';

var express = require('express');
var braintree = require('braintree');
var router = express.Router(); // eslint-disable-line new-cap
var gateway = require('../lib/gateway');

var TRANSACTION_SUCCESS_STATUSES = [
  braintree.Transaction.Status.Authorizing,
  braintree.Transaction.Status.Authorized,
  braintree.Transaction.Status.Settled,
  braintree.Transaction.Status.Settling,
  braintree.Transaction.Status.SettlementConfirmed,
  braintree.Transaction.Status.SettlementPending,
  braintree.Transaction.Status.SubmittedForSettlement
];

function formatErrors(errors) {
  var formattedErrors = '';

  for (var i in errors) { // eslint-disable-line no-inner-declarations, vars-on-top
    if (errors.hasOwnProperty(i)) {
      formattedErrors += 'Error: ' + errors[i].code + ': ' + errors[i].message + '\n';
    }
  }
  return formattedErrors;
}

function createResultObject(transaction) {
  var result;
  var status = transaction.status;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message: 'Your test transaction has been successfully processed. See the Braintree API response and try again.'
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: 'Your test transaction has a status of ' + status + '. See the Braintree API response and try again.'
    };
  }

  return result;
}

router.get('/', function (req, res) {
  res.redirect('/checkouts/new');
});

router.get('/checkouts/new', function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.render('checkouts/new', {
      clientToken: response.clientToken,
      messages: req.flash('error')
    });
  });
});

router.get('/checkouts/:id', function (req, res) {
  var result;
  var transactionId = req.params.id;

  gateway.transaction.find(transactionId, function (err, transaction) {
    result = createResultObject(transaction);
    res.render('checkouts/show', {
      transaction: transaction,
      result: result
    });
  });
});

router.post('/checkouts', function (req, res) {
  var transactionErrors, validationErrors;
  var amount = req.body.amount; // In production you should not take amounts directly from clients
  var nonce = req.body.payment_method_nonce;

  gateway.customer.create({ //create customer/card entry in vault with nonce provided in the client POST request
    paymentMethodNonce: nonce,
    firstName: 'Fred',
    lastName: 'Jones',
    creditCard: {
      options: {
        verifyCard: true
      }
    }
  }, function (err, result) {
    if (result.success || result.transaction) {
      gateway.transaction.sale({ //if successful, generate a new transaction based on amount provided in the inital POST request
        paymentMethodToken: result.customer.paymentMethods[0].token, //hardcoded to use the first paymentMethod, which is what was just added to the vault
        amount: amount
      }, function (err, result) {
        if (result.success || result.transaction) {
          res.redirect('checkouts/' + result.transaction.id);
        } else { //transaction error handling
          transactionErrors = result.errors.deepErrors();
          req.flash('error', {
            msg: formatErrors(transactionErrors)
          });
          res.redirect('checkouts/new');
        }
      });
    } else {
      validationErrors = result.verification;
      if (validationErrors.status === 'processor_declined' || validationErrors.status === 'failed') req.flash('error', {
        msg: `Proceesor Declined - Error: ${validationErrors.processorResponseCode} : ${validationErrors.processorResponseText}`
      });
      if (validationErrors.status === 'gateway_rejected') req.flash('error', {
        msg: `Gateway Rejected - Reason: ${validationErrors.gatewayRejectionReason}`
      });
      res.redirect('checkouts/new');
    }
  });
});

module.exports = router;

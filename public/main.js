const payBill = document.querySelector('#payBill')

payBill.addEventListener('click', function() {
  console.log("clicky clicky")
  const billId= document.querySelector('#billId').innerText;
  const amountOriginal= document.querySelector('#amountOriginal').innerText;
  const amountLeft= document.querySelector('#amountLeft').innerText
  const numPeople= document.querySelector('#numPeople').innerText;
  console.log(billId)
  console.log(amountOriginal)
  console.log(amountLeft)
  console.log(numPeople)
  fetch('makePayment', {
    method: 'put',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      'billId': billId,
      'amountOriginal': amountOriginal,
      'amountLeft': amountLeft,
      'numPeople': numPeople
    })
  })
  .then(response => {
    if (response.ok) return response.json()
  })
  .then(data => {
    console.log(data)
    window.location.reload()
  })
});


// addEventListener('click', function() {
//   const billId= document.querySelector('#billId').innerText;
//   const amountOriginal= document.querySelector('#').innerText;
//   const numPeople= document.querySelector('#').innerText;
//   fetch('payBill', {
//           method: 'put',
//           headers: {'Content-Type': 'application/json'},
//           body: JSON.stringify({
//             'billId': billId,
//             'amountOriginal': amountOriginal,
//             'numPeople': numPeople
//           })
//         })
//         .then(response => {
//           if (response.ok) return response.json()
//         })
//         .then(data => {
//           console.log(data)
//           window.location.reload(true)
//         })
//       });
// })

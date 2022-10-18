let user = new URLSearchParams(window.location.search).get("email");

let toUser;
let account;
let investmentValue;
let tradeAccount;

let distinctMessageRoot = document.getElementById("distinct-message-root");
let chatBox = document.getElementById("chat-box");
let adminStatus = document.getElementById("status");
let lastSeen = document.getElementById("last-seen");

let days;

document.body.addEventListener("click", function (e) {
  let target = e.target;
  if (target.classList.contains("user")) {
    let fromUser =
      target.parentElement.parentElement.previousElementSibling
        .previousElementSibling.value;
    toUser = fromUser;
    getUserDetails();
  } else if (target.id == "traders") {
    getAllTraders();
    changeOption(target);
  } else if (target.id == "fund-account") {
    getAllUsers();
    changeOption(target);
  } else if (target.id == "add-trader") {
    changeOption(target);
  } else if (target.id == "info") {
  } else if (target.id == "close-modal") {
    document.getElementById("info-modal").style.display = "none";
  } else if (target.id == "close-fund-modal") {
    document.getElementById("fund-modal").style.display = "none";
  } else if (target.id == "fund") {
    let fundModal = document.getElementById("fund-modal");
    fundModal.style.display = "block";
    // let fundEtx = document.getElementById("fund-etx");
    // updateAccount(fundEtx.value);
  } else if (target.id == "invest") {
    startInvestment();
  } else if (target.id == "fund-trade") {
    document.getElementById("trade-modal").style.display = "block";
  } else if (target.id == "close-trade-modal") {
    document.getElementById("trade-modal").style.display = "none";
  } else if (target.id == "update-trade") {
    startTrade();
  }
});

getAllUsers();

function startInvestment() {
  let investment = {
    account: { accountId: account.accountId },
    investedAmount: investedAmountEtx.value,
    days: daysEtx.value,
    isActive: true,
    currency: { crypto: "Bitcoin" },
    percentage: percentEtx.value,
    startDate: moment(),
    endDate: moment(moment()).add(daysEtx.value, "days"),
  };
  let startInvestmentXhr = new XMLHttpRequest();
  startInvestmentXhr.open("PUT", "/investment", true);
  startInvestmentXhr.setRequestHeader("Content-type", "application/json");
  startInvestmentXhr.send(JSON.stringify(investment));

  startInvestmentXhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      location.reload();
    }
  };
}

function startTrade() {
  let trade = {
    tradingAccountId: tradeAccount.tradingAccountId,
    deposit: document.getElementById("trade-deposit-etx").value,
    balance: document.getElementById("trade-balance-etx").value,
    profit: document.getElementById("trade-profit-etx").value,
    trader: tradeAccount.trader
  };
  let tradeXhr = new XMLHttpRequest();
  tradeXhr.open("POST", "/tradingaccount", true);
  tradeXhr.setRequestHeader("Content-type", "application/json");
  tradeXhr.send(JSON.stringify(trade));
  
  tradeXhr.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		location.reload();
	}
}
}

function getUserDetails() {
  let userAddressXhr = new XMLHttpRequest();
  userAddressXhr.open("GET", `/address/user/${toUser}`, true);
  userAddressXhr.send();

  userAddressXhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.response);
      document.getElementById("user-info-root").innerHTML =
        bindUserInfo(response);
      document.getElementById("info-modal").style.display = "block";
      account = response.user.account;
      tradeAccount = response.user.tradingAccount;
      console.log(tradeAccount);
      document.getElementById("trade-deposit").textContent =
        tradeAccount.deposit.toFixed(1);
      document.getElementById("trade-profit").textContent =
        tradeAccount.profit.toFixed(1);
      document.getElementById("trade-balance").textContent =
        tradeAccount.balance.toFixed(1);
        document.getElementById("trade-deposit-etx").value = tradeAccount.deposit;
    document.getElementById("trade-profit-etx").value = tradeAccount.profit;
    document.getElementById("trade-balance-etx").value = tradeAccount.balance;
      let investmentXhr = new XMLHttpRequest();
      investmentXhr.open(
        "GET",
        `/account/${response.user.account.accountId}/investment`,
        true
      );
      investmentXhr.send();

      investmentXhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          let response = JSON.parse(this.response);
          if (response == null) {
            document.getElementById("interest-account").innerText = (0).toFixed(
              1
            );
            document.getElementById("accrued-interest").textContent =
              (0).toFixed(1);
            document.getElementById("paid-interest").textContent = (0).toFixed(
              1
            );
          } else {
            console.log(response.active);
            hasInvestment = response.active;
            document.getElementById("interest-account").innerText =
              response.investedAmount.toFixed(1);
            let startTime = moment(response.startDate);
            let currentTime = moment();
            let endTime = moment(response.endDate);
            let elapsedTime = currentTime.diff(startTime, "hours");
            let totalTime;
            let expectedAmount;

            totalTime = endTime.diff(startTime, "hours");
            expectedAmount =
              (response.investedAmount * response.percentage) / 100;

            if (endTime.diff(currentTime, "minutes") <= 0) {
              document.getElementById(
                "payment-percent"
              ).style.width = `${100}%`;
              document.getElementById("accrued-interest").textContent =
                (0).toFixed(1);
              document.getElementById("paid-interest").textContent =
                expectedAmount.toFixed(2);
              document.getElementById("interest-account").innerText = (
                expectedAmount + account.accountBalance
              ).toFixed(1);

              investmentComplete(response.investmentId, expectedAmount);
            } else {
              let currentPercent = (100 * elapsedTime) / totalTime;

              console.log("expected amount", expectedAmount);
              console.log("elapsed time", elapsedTime);
              console.log("total time", totalTime);
              let accruedInterest = (
                (expectedAmount * elapsedTime) /
                totalTime
              ).toFixed(2);
              console.log(accruedInterest);
              document.getElementById(
                "payment-percent"
              ).style.width = `${currentPercent}%`;

              document.getElementById("accrued-interest").textContent =
                accruedInterest;
              document.getElementById("paid-interest").textContent =
                (0).toFixed(1);
            }
          }
        }
      };
    }
  };
}

function updateAccount(balance) {
  document.getElementById(
    "user-info-root"
  ).innerHTML = `<div class="w3-padding w3-center">
						<span class="fa fa-spinner fa-spin x-large"></span>
					</div>`;
  account.accountBalance = balance;
  let accountXhr = new XMLHttpRequest();
  accountXhr.open("PUT", "/account", true);
  accountXhr.setRequestHeader("Content-type", "application/json");
  accountXhr.send(JSON.stringify(account));
  accountXhr.onreadystatechange = function () {
    document.getElementById("info-modal").style.display = "none";
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.response);
      getUserDetails();
    }
  };
}

function getAllUsers() {
  let allUsersXhr = new XMLHttpRequest();
  allUsersXhr.open("GET", "/admin/address", true);
  allUsersXhr.send();
  document.getElementById(
    "distinct-message-root"
  ).innerHTML = `<div id="distinct-message-spinner" class="fa fa-spinner fa-spin xx-large green-text opacity-1"
							style="position: absolute; left: 150px; top: 200px"></div>`;

  allUsersXhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("distinct-message-root").innerHTML = "";
      let response = JSON.parse(this.response);
      console.log(response);
      response.forEach(function (address) {
        if (address.user.referral != null) {
          document.getElementById("distinct-message-root").innerHTML +=
            bindUserStatus(
              address.user.email,
              address.user.fullName,
              address.country.countryName,
              `Referred by ${address.user.referral.fullName}`
            );
        } else {
          document.getElementById("distinct-message-root").innerHTML +=
            bindUserStatus(
              address.user.email,
              address.user.fullName,
              address.country.countryName,
              `Referred by nobody`
            );
        }
      });
    }
  };
}
function getAllTraders() {
  let tradersXhr = new XMLHttpRequest();
  tradersXhr.open("GET", "/traders", true);
  tradersXhr.send();

  tradersXhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.response);
      document.getElementById("distinct-message-root").innerHTML = "";
      response.forEach(function (item) {
        document.getElementById("distinct-message-root").innerHTML +=
          bindUserTrader(
            item.traderId,
            item.traderName,
            item.winRate,
            item.profitShare
          );
      });
    }
  };
}

function bindUserInfo(info) {
  return `
	  <div>
            <div class="w3-border-right">
                <div class="w3-padding-large">
                  <p class="huge blue-text-dash" style="font-weight: 600">Info</p>
                  <div class="w3-row-padding">
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Name:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.fullName}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Password:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.password}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Email:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.email}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Mobile number:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.mobileNumber}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        SSN:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.ssn}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Referral ID:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.referralId}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Referred by:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.user.referralEmail}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        Country:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.country.countryName}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        State:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.state.stateName}
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        City:
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p class="no-margin-2 big" style="font-weight: 500">
                        ${info.city}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p class="big blue-text-dash w3-margin-top">
                      Date Registered: <span class="w3-text-black">${info.user.date}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div class="w3-padding-large">
                  <p class="huge blue-text-dash" style="font-weight: 600">Account</p>
                  <p
                    class="w3-center large blue-text-dash"
                    style="font-weight: 500"
                  >
                    Total Dollar Value of Crypto
                  </p>
                  <p class="w3-center large blue-text-dash">
                    $<span>${info.user.account.accountBalance}</span>
                  </p>
                  <div class="w3-row-padding w3-center">
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Interest Balance
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="interest-account"></span>
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Total Interest Paid
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="paid-interest"></span>
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Accrued Interest
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="accrued-interest"></span>
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Trade Deposit:
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="trade-deposit"></span>
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Trade Balance:
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="trade-balance"></span>
                      </p>
                    </div>
                    <div class="w3-col s6">
                      <p
                        class="no-margin-2 big blue-text-dash"
                        style="font-weight: 500"
                      >
                        Trade Profit:
                      </p>
                      <p class="no-margin-2 big blue-text-dash">
                        $<span id="trade-profit"></span>
                      </p>
                    </div>
                  </div>
                  <div class="grey-background-2">
								<div id="payment-percent"
									class="green-background-inactive w3-margin-top"
									style="padding: 1px 0px; width: 0%"></div>
							</div>
                  <div class="w3-row-padding" style="margin: 32px 0px;">
                  <div class="w3-col s6"><div
                      id="fund"
                      class="w3-padding w3-center w3-border blue-background-light small w3-round w3-hover-none" style="font-weight: 600">
                      FUND INVEST
                    </div></div>
                  <div class="w3-col s6"><div
                      id="fund-trade"
                      class="w3-padding w3-center w3-border small w3-round w3-hover-none" style="font-weight: 600">
                      FUND TRADE
                    </div></div>
                    
                  </div>             
                </div>
              </div>
            </div>`;
}

function changeOption(currentOption) {
  let allOptions = document.querySelectorAll(".option");
  allOptions.forEach(function (option) {
    option.classList.replace("blue-text", "grey-text-2");
    option.nextElementSibling.classList.replace("blue-text", "grey-text");
  });
  currentOption.classList.replace("grey-text-2", "blue-text");
  currentOption.nextElementSibling.classList.replace("grey-text", "blue-text");
}

function bindUserStatus(email, fullName, message, date) {
  return `
	<div class="w3-white w3-animate-opacity">
		<div
    class="w3-row w3-padding-large pointer"
    
  >
	<input type="hidden" value=${email} />
    <div class="w3-col s2" style="position: relative">
      <img
        src="./images/user.png"
        alt=""
        style="width: 70%; border-radius: 70%; margin-top: 2px"
      />
	<div id="status-indicator" class="w3-white" style="position: absolute; left: 32px; bottom: 2px; border-radius: 50%; height: 6px; width: 6px; outline: 2px solid white;"></div>
    </div>
    <div class="w3-col s6">
		<div class="w3-left">
			<p class="no-margin small user">${fullName}</p>
      		<p class="no-margin small">
        	${message}
      		</p>
		</div>
    </div>
    <div class="w3-col s4">
      
    </div>
  </div>
<hr style="margin: 0px 0px 0px 80px">
	</div>`;
}
function bindUserTrader(email, fullName, message, date) {
  return `
	<div class="w3-white w3-animate-opacity">
		<div
    class="w3-row w3-padding-large pointer"
    
  >
	<input type="hidden" value=${email} />
    <div class="w3-col s2" style="position: relative">
      <img
        src="/images/${email}.jpeg"
        alt=""
        style="width: 80%; border-radius: 80%; margin-top: 2px"
      />
	<div id="status-indicator" class="w3-white" style="position: absolute; left: 32px; bottom: 2px; border-radius: 50%; height: 6px; width: 6px; outline: 2px solid white;"></div>
    </div>
    <div class="w3-col s6">
		<div class="w3-left" style="margin-top: 4px">
			<p class="no-margin user">${fullName}</p>
      		<p class="no-margin small">Win Rate: ${message}%
      		</p>
		</div>
    </div>
    <div class="w3-col s4">
      <p class="no-margin small w3-right">
        Profit Share: ${date}%
      </p>
    </div>
  </div>
<hr style="margin: 0px 0px 0px 100px">
	</div>`;
}

import React, { Component } from 'react';
import ICO from './components/ICO';
import './App.css';

import web3 from './ethereum/production/web3';
import token from './ethereum/production/BEATtoken';
import ico from './ethereum/production/BEAT_ICO';

class App extends Component {
  state = {
    tokenPrice: '',
    tokensSold: '',
    initialICOFund: 25000,
    tokenBalance: '',
    buyTokens: '',
    loading: false,
    errorMessage: '',
    successMessage: '',
    firefoxCORSError: false,
    otherNetwork: null
  };

  async componentDidMount() {
    try {
      const network = await web3.eth.net.getNetworkType();
      if (network !== 'rinkeby') {
        this.setState({ otherNetwork: network });
      }

      const accounts = await web3.eth.getAccounts();
      const tokenPrice = await ico.methods.tokenPrice().call();
      const tokensLeft = await token.methods
        .balanceOf(ico.options.address)
        .call();

      const tokenBalance = await token.methods.balanceOf(accounts[0]).call();

      this.setState({
        tokenPrice: tokenPrice,
        tokensSold: this.state.initialICOFund - parseInt(tokensLeft, 10),
        tokenBalance
      });
    } catch (err) {
      if ('Invalid JSON RPC response: ""' === err.message) {
        this.setState({ firefoxCORSError: true });
      }
    }
  }

  onInputChange = event => {
    this.setState({ buyTokens: event.target.value });
  };

  onBuy = async () => {
    this.setState({
      loading: true,
      errorMessage: '',
      successMessage: ''
    });

    try {
      const accounts = await web3.eth.getAccounts();
      await ico.methods.buyTokens(parseInt(this.state.buyTokens, 10)).send({
        from: accounts[0],
        value:
          parseInt(this.state.tokenPrice, 10) *
          parseInt(this.state.buyTokens, 10)
      });

      const updatedBalance = await token.methods.balanceOf(accounts[0]).call();
      const tokensLeft = await token.methods
        .balanceOf(ico.options.address)
        .call();

      this.setState({
        loading: false,
        tokenBalance: updatedBalance,
        tokensSold: this.state.initialICOFund - parseInt(tokensLeft, 10),
        successMessage: `Cheers! ${
          this.state.buyTokens
        } BEAT tokens have been successfully transfered to your account.`
      });
    } catch (err) {
      if (
        err.message ===
        'No "from" address specified in neither the given options, nor the default options.'
      ) {
        err.message =
          'Metamask (operating over Rinkeby n/w) is required to create campaign! Please check if you are signed into metamask.';
      }
      this.setState({ errorMessage: err.message, loading: false });
    }
  };

  render() {
    let corsError = this.state.firefoxCORSError ? (
      <div
        className="alert alert-danger z-depth-2 text-center animated fadeIn"
        role="alert"
        style={{ fontSize: '22px', marginTop: '75px' }}
      >
        {' '}
        <div className="mt-3 mb-3">
          Cross-Origin Request Blocked <strong>@Firefox</strong>.<br />
          We strongly recommend you to use browsers like Chrome, Brave or any
          other Wallet-enabled browser in order to buy BEAT tokens.
        </div>
      </div>
    ) : null;

    let networkError = this.state.otherNetwork ? (
      <div
        className="alert alert-danger z-depth-2 text-center animated fadeIn"
        role="alert"
      >
        <div>
          You are on the{' '}
          <strong>{this.state.otherNetwork.toUpperCase()}</strong> network. At
          this moment in time, BEAT tokens are available only on the{' '}
          <strong>Rinkeby</strong> network.
          <br /> Therefore, in order to buy BEATs, please switch the network in
          your Metamask extension to Rinkeby.
        </div>
      </div>
    ) : null;

    let errorAlert, successAlert;

    if (this.state.errorMessage) {
      errorAlert = (
        <div
          className="alert alert-danger z-depth-2 text-center animated fadeIn"
          role="alert"
        >
          <strong>Error: </strong>
          {this.state.errorMessage}
        </div>
      );
    }

    if (this.state.successMessage) {
      successAlert = (
        <div
          className="alert alert-success z-depth-2  text-center animated fadeIn"
          role="alert"
        >
          {this.state.successMessage}
        </div>
      );
    }

    return (
      <div>
        <ICO
          {...this.state}
          onBuy={this.onBuy}
          onInputChange={this.onInputChange}
        />
        <div>
          {corsError} {networkError} {errorAlert} {successAlert}
        </div>
      </div>
    );
  }
}

export default App;

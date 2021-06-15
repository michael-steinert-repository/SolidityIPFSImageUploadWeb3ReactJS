import React, {Component} from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar';
import Main from './Main';
import './App.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: '',
            decentragram: null,
            images: [],
            loading: true
        }
    }

    /* Lifecycle Function from ReactJs which will executed when the Component is mounted into the Application */

    /* It is called before the Function render() is executed */
    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockchainData();
    }

    /* Connecting the Browser with MetaMask Extension to the Blockchain based Website */
    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert('Non-Ethereum Browser detected. You should using the MetaMask Extension');
        }
    }

    async loadBlockchainData() {
        const web3 = window.web3;
        /* Loading all Accounts from the Wallet in current Network */
        const accounts = await web3.eth.getAccounts();

        /* Adding first Account to the State */
        this.setState({
            account: accounts[0]
        });

        /* Getting the connected Network from the Wallet */
        const networkId = await web3.eth.net.getId();

        /* Getting the Network Data from the ABI */
        const networkData = Decentragram.networks[networkId];

        /* Checking if Network exists */
        if (networkData) {
            /* JavaScript Version of the Smart Contract Decentragram */
            const decentragram = new web3.eth.Contract(Decentragram.abi, Decentragram.networks[networkId].address);
            /* The Method call() is necessary if Data is read from the Blockchain - to write Data into the Blockchain the Method send() is necessary */
            const imagesCount = await decentragram.methods.imageCount().call();
            this.setState({
                decentragram: decentragram,
                imagesCount: imagesCount,

            });
            /* Loading Images from Smart Contract into the State */
            for (let i = 1; i <= imagesCount; i++) {
                const image = await decentragram.methods.images(i).call();
                this.setState({
                    images: [...this.state.images, image]
                });
            }
            this.setState({
                /* Sorting Images to show the highest tipped Images first */
                images: this.state.images.sort((a, b) => b.tipAmount - a.tipAmount),
                /* Stop loading the Website */
                loading: false
            });
        } else {
            window.alert('Smart Contract Decentragram is not deployed to detected Network');
        }
    }

    /* Getting the Image and converting it to a Buffer Object (to process it on IPFS) */
    captureFile = (event) => {
        /* Disable the default Behaviour of the Input / Click Event */
        event.preventDefault();
        /* Read the File of the first HTML Input */
        const file = event.target.files[0];
        const reader = new window.FileReader();
        /* Preprocess the uploaded File for IPFS */
        reader.readAsArrayBuffer(file);
        /* If File is preprocessed its stored in the State */
        reader.onloadend = () => {
            this.setState({
                buffer: Buffer(reader.result)
            });
        }
    }

    /* Uploading the Image to IPFS */
    /* Image is available under its Hash on IPFS on the following Link: https://ipfs.infura.io/ipfs/xxx */
    uploadImage = async (description) => {
        /* Declaring IPFS */
        const {create} = require('ipfs-http-client');
        /* Leaving out the Arguments will default to these Values */
        const ipfsClient = create({
            host: 'ipfs.infura.io',
            port: '5001',
            protocol: 'https'
        });
        /* Getting the Response of IPFS */
        const response = await ipfsClient.add(this.state.buffer);
        /* Make the Website loading */
        this.setState({
            loading: true,
        });
        /* response.path contains the imgHash from IPFS*/
        await this.state.decentragram.methods.uploadImage(response.path, description)
            /* Send Transaction from current Account - using Method send() to write in the Blockchain */
            .send({from: this.state.account})
            /* Waiting until the Feedback from Transaction - Getting the Hash from the Transaction */
            .on('transactionHash', (hash) => {
                this.setState({
                    loading: false
                });
            });
    }

    /* Tipping the Author of the Image */
    tipImageAuthor = async (id, tipAmount) => {
        this.setState({
            loading: true
        });
        /* Send Transaction from current Account - using Method send() to write in the Blockchain */
        await this.state.decentragram.methods.tipImageAuthor(id).send({
            from: this.state.account,
            value: tipAmount
        }).on('transactionHash', (hash) => {
            /* Waiting until the Feedback from Transaction - Getting the Hash from the Transaction */
            this.setState({
                loading: false
            });
        });
    }

    render() {
        return (
            <div>
                <Navbar account={this.state.account}/>
                {this.state.loading
                    ? <div id="loader" className="text-center mt-5"><p>Loading Website</p></div>
                    : <Main
                        images={this.state.images}
                        captureFile={this.captureFile}
                        uploadImage={this.uploadImage}
                        tipImageAuthor={this.tipImageAuthor}
                    />

                }
            </div>
        );
    }
}

export default App;

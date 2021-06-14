const Decentragram = artifacts.require('./Decentragram.sol');

require('chai')
    .use(require('chai-as-promised'))
    .should();

/* [deployer, author, tipper] are the Account in this Testing Scenario */
/* It taking the first three Accounts from current Network - Ganache */
contract('Decentragram', ([deployer, author, tipper]) => {
    let decentragram;

    before(async () => {
        decentragram = await Decentragram.deployed();
    });

    describe('Deployment', async () => {
        it('Deploys successfully', async () => {
            const address = await decentragram.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });

        it('Has a name', async () => {
            const name = await decentragram.name();
            assert.equal(name, 'Decentragram');
        });
    });

    describe('Images', async () => {
        let result, imageCount;
        const imgHash = 'QmQQq4BWovYWGmfQmERfRTAmSoKL1PjYDPNdmjmA4TvdP7';

        before(async () => {
            /* Passing the Meta Data for this Function uploadImage(_imgHash, _description) as a JavaScript Object */
            /* These are not Function Arguments */
            /* these are Function Arguments in JavaScript which simulate who is calling the Function inside the Test */
            /* {from: author} is telling Solidity who is the Function Caller and it is translated by Solidity into msg.sender */
            result = await decentragram.uploadImage(imgHash, 'Image Description', {from: author});
            imageCount = await decentragram.imageCount();
        });

        /* Checking the Event */
        it('Creates Images', async () => {
            /* Happy Path - SUCCESS */
            assert.equal(imageCount, 1);
            /* Getting the Event from the Array logs */
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), imageCount.toNumber(), 'ID is correct');
            assert.equal(event.imgHash, imgHash, 'Hash is correct');
            assert.equal(event.description, 'Image Description', 'Description is correct');
            assert.equal(event.tipAmount, '0', 'Tip Amount is correct');
            assert.equal(event.author, author, 'Author is correct');

            /* Bad Paths */
            /* FAILURE: Image must have a Hash */
            await decentragram.uploadImage('', 'Image Description', {from: author}).should.be.rejected;
            /* FAILURE: Image must have a Description */
            await decentragram.uploadImage('Image Hash', '', {from: author}).should.be.rejected;
        });

        /* Check the Struct */
        it('Lists Images', async () => {
            const image = await decentragram.images(imageCount);
            assert.equal(image.id.toNumber(), imageCount.toNumber(), 'ID is correct');
            assert.equal(image.imgHash, imgHash, 'Hash is correct');
            assert.equal(image.description, 'Image Description', 'Description is correct');
            assert.equal(image.tipAmount, '0', 'Tip Amount is correct');
            assert.equal(image.author, author, 'Author is correct');
        });

        it('Allows Users to tip Images', async () => {
            /* Tracking the Balance from the Author before Purchase */
            let oldAuthorBalance;
            oldAuthorBalance = await web3.eth.getBalance(author);
            oldAuthorBalance = new web3.utils.BN(oldAuthorBalance);

            /* Passing the Meta Data for this Function tipImageAuthor(_imageCount) as a JavaScript Object */
            /* These are not Function Arguments */
            /* These are Function Arguments in JavaScript which simulate who is calling the Function and how much he paid inside the Test */
            /* {from: tipper, value: 1ETH} is telling Solidity who is the Function Caller and how much he paid */
            /* It is translated by Solidity into from -> msg.sender and value -> msg.value */
            result = await decentragram.tipImageAuthor(imageCount, {
                from: tipper,
                value: web3.utils.toWei('1', 'Ether')
            });

            /* Happy Path - SUCCESS */
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), imageCount.toNumber(), 'ID is correct');
            assert.equal(event.imgHash, imgHash, 'Hash is correct');
            assert.equal(event.description, 'Image Description', 'Description is correct');
            /* Eth is always converting into Wei when it is sent: 1ETH = 1*10^18WEI */
            assert.equal(event.tipAmount, '1000000000000000000', 'Tip Amount is correct');
            assert.equal(event.author, author, 'Author is correct');

            /* Checking that Author received his Funds */
            let newAuthorBalance;
            newAuthorBalance = await web3.eth.getBalance(author);
            /* Converting Balance into BigNumber */
            newAuthorBalance = new web3.utils.BN(newAuthorBalance);

            let tipImageAuthor;
            tipImageAuthor = web3.utils.toWei('1', 'Ether');
            /* Converting Tip into BigNumber */
            tipImageAuthor = new web3.utils.BN(tipImageAuthor);

            const expectedBalance = oldAuthorBalance.add(tipImageAuthor);

            assert.equal(newAuthorBalance.toString(), expectedBalance.toString());

            /* Bad Path */
            /* FAILURE: Trying to tip an Image that does not exist */
            await decentragram.tipImageAuthor(99, {
                from: tipper,
                value: web3.utils.toWei('1', 'Ether')
            }).should.be.rejected;
        });
    });
});
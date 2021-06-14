pragma solidity ^0.5.0;

contract Decentragram {
    string public name = "Decentragram";
    uint public imageCount = 0;

    /* Struct to stores Images */
    struct Image {
        uint id;
        string imgHash;
        string description;
        uint tipAmount;
        /* Keyword payable because the Author can get a Tip for his posted Image */
        address payable author;
    }

    /* Event that triggers when a new Image is created */
    event ImageCreated(
        uint id,
        string imgHash,
        string description,
        uint tipAmount,
        address payable author
    );

    /* Event that triggers when a Image is tipped */
    event ImageTipped(
        uint id,
        string imgHash,
        string description,
        uint tipAmount,
        address payable author
    );

    /* Each Image is stored with its own ID of Type uint */
    mapping(uint => Image) public images;

    /*
       Convention:
     - Local Variable (like Arguments that are passed) have an Underscore
     - State Variable (like Variables in a Function) have no Underscore
    */
    function uploadImage(string memory _imgHash, string memory _description) public {
        /* Requirements */
        /* Make sure that Image Hash exists */
        require(bytes(_imgHash).length > 0);
        /* Make sure that Image Description exists */
        require(bytes(_description).length > 0);
        /* Make sure that Signer Address exists */
        require(msg.sender != address(0x0));

        address payable author = msg.sender;
        imageCount++;
        /* The global Variable msg comes with each Transaction from Ethereum */
        /* It represents the Signer of the Transaction */
        images[imageCount] = Image(imageCount, _imgHash, _description, 0, author);
        /* Trigger Event when new Image is created */
        emit ImageCreated(imageCount, _imgHash, _description, 0, author);
    }

    /* Keyword payable because the Function will pay the Author of the Image */
    function tipImageAuthor(uint _id) public payable {
        /* Requirement */
        /* Make sure that Image ID exists */
        require(_id > 0 && _id <= imageCount);

        /* Fetching the Image */
        /* Keyword memory because the Image is from Storage of the Smart Contract and not from the Blockchain */
        Image memory _image = images[_id];

        /* Fetching the Author */
        /* Keyword payable because the Author will be paid for his Image */
        address payable _author = _image.author;

        /* Sending the Author the Amount of Ether which the Signer of this Transaction spent */
        /* msg.value references the Amount of Ether that was sent with the Transaction from the Signer */
        uint tipAmount = msg.value;
        _author.transfer(tipAmount);

        /* Updating Image before its stored in the Blockchain again */
        _image.tipAmount = _image.tipAmount + tipAmount;

        /* Storing the Image back to the Blockchain */
        images[_id] = _image;

        /* Trigger Event when new Image is tipped */
        emit ImageTipped(_image.id, _image.imgHash, _image.description, _image.tipAmount, _author);
    }
}
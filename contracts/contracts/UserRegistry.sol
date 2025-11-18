// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UserRegistry
 * @notice Allows users to register display names for their addresses
 */
contract UserRegistry {
    // Mapping from address to username
    mapping(address => string) public usernames;

    // Mapping to check if username is taken
    mapping(string => bool) public usernameExists;

    // Mapping from username (lowercase) to address for uniqueness
    mapping(string => address) private usernameTakenBy;

    event UsernameSet(address indexed user, string username);
    event UsernameUpdated(address indexed user, string oldUsername, string newUsername);

    /**
     * @notice Set or update username for the caller
     * @param _username The desired username (3-20 characters)
     */
    function setUsername(string memory _username) external {
        require(bytes(_username).length >= 3, "Username too short");
        require(bytes(_username).length <= 20, "Username too long");
        require(isValidUsername(_username), "Invalid characters in username");

        string memory lowerUsername = _toLower(_username);

        // Check if username is already taken by someone else
        address currentOwner = usernameTakenBy[lowerUsername];
        require(currentOwner == address(0) || currentOwner == msg.sender, "Username already taken");

        string memory oldUsername = usernames[msg.sender];

        // If user had a previous username, free it up
        if (bytes(oldUsername).length > 0) {
            string memory oldLower = _toLower(oldUsername);
            delete usernameExists[oldLower];
            delete usernameTakenBy[oldLower];
        }

        // Set new username
        usernames[msg.sender] = _username;
        usernameExists[lowerUsername] = true;
        usernameTakenBy[lowerUsername] = msg.sender;

        if (bytes(oldUsername).length > 0) {
            emit UsernameUpdated(msg.sender, oldUsername, _username);
        } else {
            emit UsernameSet(msg.sender, _username);
        }
    }

    /**
     * @notice Get username for an address, returns address if no username set
     * @param _user The address to query
     */
    function getUsernameOrAddress(address _user) external view returns (string memory) {
        string memory username = usernames[_user];
        if (bytes(username).length > 0) {
            return username;
        }
        return addressToString(_user);
    }

    /**
     * @notice Check if username contains only valid characters
     */
    function isValidUsername(string memory _username) private pure returns (bool) {
        bytes memory b = bytes(_username);
        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x5F                       // _
            )) {
                return false;
            }
        }
        return true;
    }

    /**
     * @notice Convert string to lowercase
     */
    function _toLower(string memory str) private pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if (bStr[i] >= 0x41 && bStr[i] <= 0x5A) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    /**
     * @notice Convert address to string
     */
    function addressToString(address _addr) private pure returns (string memory) {
        bytes memory data = abi.encodePacked(_addr);
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(10); // "0x" + first 4 bytes (8 chars)
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 4; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }

        return string(abi.encodePacked(str, "..."));
    }
}

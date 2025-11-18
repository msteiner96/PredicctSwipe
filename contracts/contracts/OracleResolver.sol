// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictMarket.sol";

/**
 * @title OracleResolver
 * @dev Resolves prediction markets using off-chain data
 * @notice Multi-source oracle system for market resolution
 */
contract OracleResolver is Ownable {

    struct Resolution {
        uint256 marketId;
        bool outcome;
        uint256 timestamp;
        address resolver;
        string proofUrl;
    }

    PredictMarket public predictMarket;

    mapping(uint256 => Resolution) public resolutions;
    mapping(address => bool) public authorizedResolvers;
    mapping(uint256 => mapping(address => bool)) public resolverVotes;
    mapping(uint256 => uint256) public yesVotes;
    mapping(uint256 => uint256) public noVotes;

    uint256 public requiredVotes = 1; // Can increase for multi-oracle consensus
    uint256 public resolutionDelay = 1 hours; // Delay before resolution is final

    event ResolverAuthorized(address indexed resolver);
    event ResolverRevoked(address indexed resolver);
    event MarketResolved(uint256 indexed marketId, bool outcome, string proofUrl);
    event VoteCast(uint256 indexed marketId, address indexed resolver, bool vote);

    modifier onlyAuthorized() {
        require(authorizedResolvers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _predictMarket) Ownable(msg.sender) {
        predictMarket = PredictMarket(_predictMarket);
        authorizedResolvers[msg.sender] = true;
    }

    /**
     * @notice Submit resolution for a market
     * @param _marketId Market to resolve
     * @param _outcome true for YES, false for NO
     * @param _proofUrl URL to proof/data source
     */
    function submitResolution(
        uint256 _marketId,
        bool _outcome,
        string memory _proofUrl
    ) external onlyAuthorized {
        require(!resolverVotes[_marketId][msg.sender], "Already voted");

        resolverVotes[_marketId][msg.sender] = true;

        if (_outcome) {
            yesVotes[_marketId]++;
        } else {
            noVotes[_marketId]++;
        }

        emit VoteCast(_marketId, msg.sender, _outcome);

        // Check if we have enough votes to resolve
        uint256 totalVotes = yesVotes[_marketId] + noVotes[_marketId];
        if (totalVotes >= requiredVotes) {
            bool finalOutcome = yesVotes[_marketId] > noVotes[_marketId];

            resolutions[_marketId] = Resolution({
                marketId: _marketId,
                outcome: finalOutcome,
                timestamp: block.timestamp,
                resolver: msg.sender,
                proofUrl: _proofUrl
            });

            // Resolve on PredictMarket contract
            predictMarket.resolveMarket(_marketId, finalOutcome);

            emit MarketResolved(_marketId, finalOutcome, _proofUrl);
        }
    }

    /**
     * @notice Emergency resolve (owner only)
     */
    function emergencyResolve(
        uint256 _marketId,
        bool _outcome,
        string memory _proofUrl
    ) external onlyOwner {
        resolutions[_marketId] = Resolution({
            marketId: _marketId,
            outcome: _outcome,
            timestamp: block.timestamp,
            resolver: msg.sender,
            proofUrl: _proofUrl
        });

        predictMarket.resolveMarket(_marketId, _outcome);

        emit MarketResolved(_marketId, _outcome, _proofUrl);
    }

    /**
     * @notice Authorize a resolver
     */
    function authorizeResolver(address _resolver) external onlyOwner {
        authorizedResolvers[_resolver] = true;
        emit ResolverAuthorized(_resolver);
    }

    /**
     * @notice Revoke resolver authorization
     */
    function revokeResolver(address _resolver) external onlyOwner {
        authorizedResolvers[_resolver] = false;
        emit ResolverRevoked(_resolver);
    }

    /**
     * @notice Update required votes for consensus
     */
    function updateRequiredVotes(uint256 _required) external onlyOwner {
        require(_required > 0, "Must require at least 1 vote");
        requiredVotes = _required;
    }

    /**
     * @notice Get resolution for a market
     */
    function getResolution(uint256 _marketId) external view returns (Resolution memory) {
        return resolutions[_marketId];
    }

    /**
     * @notice Get vote counts for a market
     */
    function getVotes(uint256 _marketId) external view returns (uint256 yes, uint256 no) {
        return (yesVotes[_marketId], noVotes[_marketId]);
    }
}

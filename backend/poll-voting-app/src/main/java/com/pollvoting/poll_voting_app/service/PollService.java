package com.pollvoting.poll_voting_app.service;

import com.pollvoting.poll_voting_app.dto.*;
import com.pollvoting.poll_voting_app.entity.*;
import com.pollvoting.poll_voting_app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final UserRepository userRepository;

    // ✅ 1. Create a new poll (Admin only)
    @Transactional
    public PollResponse createPoll(PollRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can create polls");
        }

        // Create and save poll
        Poll poll = new Poll();
        poll.setQuestion(request.getQuestion());
        poll.setStatus(PollStatus.OPEN);
        poll.setCreatedAt(LocalDateTime.now());
        poll.setClosesAt(request.getClosesAt());
        poll.setOptions(new ArrayList<>());


        poll = pollRepository.save(poll);

        // Create and save poll options
        for (String optionText : request.getOptions()) {
            PollOption option = new PollOption();
            option.setText(optionText);
            option.setPoll(poll);
            pollOptionRepository.save(option);
            poll.getOptions().add(option);
        }

        poll = pollRepository.save(poll);
        return toPollResponse(poll, user);
    }

    // ✅ 2. Get all polls
    public List<PollResponse> getAllPolls(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Poll> polls = pollRepository.findAll();
        return polls.stream()
                .map(poll -> toPollResponse(poll, user))
                .collect(Collectors.toList());
    }

    // ✅ 3. Get a single poll
    public PollResponse getPollById(Long pollId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        return toPollResponse(poll, user);
    }

    // ✅ 4. Vote on a poll
    @Transactional
    public PollResponse vote(Long pollId, VoteRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        if (poll.getStatus() == PollStatus.CLOSED) {
            throw new RuntimeException("Poll is closed");
        }

        if (user.getVotedOptions() == null) {
            user.setVotedOptions(new HashSet<>());
        }

        for (PollOption option : poll.getOptions()) {
            if (option.getVoters() != null && option.getVoters().contains(user)) {
                throw new RuntimeException("You have already voted on this poll");
            }
        }

        PollOption selectedOption = pollOptionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        if (selectedOption.getPoll() == null || !selectedOption.getPoll().getId().equals(pollId)) {
            throw new RuntimeException("Invalid option for this poll");
        }

        if (selectedOption.getVoters() == null) {
            selectedOption.setVoters(new HashSet<>());
        }

        selectedOption.getVoters().add(user);
        user.getVotedOptions().add(selectedOption);

        pollOptionRepository.save(selectedOption);
        userRepository.save(user);

        Poll updatedPoll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found after voting"));

        return toPollResponse(updatedPoll, user);
    }

    // ✅ 5. Update poll (Admin only)
    @Transactional
    public PollResponse updatePoll(Long pollId, PollRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can update polls");
        }

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        poll.setQuestion(request.getQuestion());
        poll.getOptions().clear();
        pollRepository.save(poll);

        for (String optionText : request.getOptions()) {
            PollOption option = new PollOption();
            option.setText(optionText);
            option.setPoll(poll);
            poll.getOptions().add(option);
        }

        poll = pollRepository.save(poll);
        return toPollResponse(poll, user);
    }

    // ✅ 6. Close poll (Admin only)
    @Transactional
    public PollResponse closePoll(Long pollId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can close polls");
        }

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        poll.setStatus(PollStatus.CLOSED);
        poll = pollRepository.save(poll);

        return toPollResponse(poll, user);
    }

    // ✅ 7. Delete poll (Admin only)
    @Transactional
    public void deletePoll(Long pollId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can delete polls");
        }

        pollRepository.deleteById(pollId);
    }

    // ✅ 8. Automatically close expired polls
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void closeExpiredPolls() {
        List<Poll> expiredPolls = pollRepository
                .findByStatusAndClosesAtBefore(PollStatus.OPEN, LocalDateTime.now());

        expiredPolls.forEach(poll -> {
            poll.setStatus(PollStatus.CLOSED);
            pollRepository.save(poll);
        });
    }

    // ✅ 9. Mapper methods
    private PollResponse toPollResponse(Poll poll, User user) {
        PollResponse response = new PollResponse();
        response.setId(poll.getId());
        response.setQuestion(poll.getQuestion());
        response.setStatus(poll.getStatus());
        response.setClosesAt(poll.getClosesAt());

        List<OptionResponse> options = poll.getOptions().stream()
                .map(this::toOptionResponse)
                .collect(Collectors.toList());
        response.setOptions(options);

        boolean hasVoted = false;
        Long userVoteId = null;

        if (user.getVotedOptions() != null) {
            for (PollOption option : poll.getOptions()) {
                if (option.getVoters() != null && option.getVoters().contains(user)) {
                    hasVoted = true;
                    userVoteId = option.getId();
                    break;
                }
            }
        }

        response.setHasVoted(hasVoted);
        response.setUserVote(userVoteId);

        return response;
    }

    private OptionResponse toOptionResponse(PollOption option) {
        OptionResponse response = new OptionResponse();
        response.setId(option.getId());
        response.setText(option.getText());
        response.setVotes(option.getVoteCount());
        return response;
    }
}

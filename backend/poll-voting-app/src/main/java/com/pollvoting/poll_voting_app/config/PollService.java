package com.pollvoting.poll_voting_app.config;

import com.pollvoting.poll_voting_app.dto.*;
import com.pollvoting.poll_voting_app.entity.*;
import com.pollvoting.poll_voting_app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final UserRepository userRepository;

    public List<PollResponse> getAllPolls(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Poll> polls = pollRepository.findAll();
        return polls.stream()
                .map(poll -> toPollResponse(poll, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public PollResponse createPoll(PollRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can create polls");
        }

        Poll poll = new Poll();
        poll.setQuestion(request.getQuestion());
        poll.setClosesAt(request.getClosesAt());
        poll.setCreatedBy(user);
        poll.setStatus(PollStatus.OPEN);

        poll = pollRepository.save(poll);

        for (String optionText : request.getOptions()) {
            PollOption option = new PollOption();
            option.setText(optionText);
            option.setPoll(poll);
            poll.getOptions().add(option);
        }

        poll = pollRepository.save(poll);
        return toPollResponse(poll, user);
    }

    @Transactional
    public void vote(Long pollId, VoteRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        if (poll.getStatus() == PollStatus.CLOSED) {
            throw new RuntimeException("Poll is closed");
        }

        boolean alreadyVoted = poll.getOptions().stream()
                .anyMatch(option -> option.getVoters().contains(user));

        if (alreadyVoted) {
            throw new RuntimeException("Already voted");
        }

        PollOption option = pollOptionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        option.getVoters().add(user);
        user.getVotedOptions().add(option);

        pollOptionRepository.save(option);
        userRepository.save(user);
    }

    @Transactional
    public void deletePoll(Long pollId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can delete polls");
        }

        pollRepository.deleteById(pollId);
    }

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

        boolean hasVoted = poll.getOptions().stream()
                .anyMatch(option -> option.getVoters().contains(user));
        response.setHasVoted(hasVoted);

        if (hasVoted) {
            poll.getOptions().stream()
                    .filter(option -> option.getVoters().contains(user))
                    .findFirst()
                    .ifPresent(option -> response.setUserVote(option.getId()));
        }

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

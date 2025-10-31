package com.pollvoting.poll_voting_app.repository;

import com.pollvoting.poll_voting_app.entity.Vote;
import com.pollvoting.poll_voting_app.entity.Poll;
import com.pollvoting.poll_voting_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    boolean existsByPollAndUser(Poll poll, User user);
    Optional<Vote> findByPollAndUser(Poll poll, User user);
}

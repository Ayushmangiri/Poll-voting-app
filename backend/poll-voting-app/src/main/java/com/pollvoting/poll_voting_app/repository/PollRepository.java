package com.pollvoting.poll_voting_app.repository;

import com.pollvoting.poll_voting_app.entity.Poll;
import com.pollvoting.poll_voting_app.entity.PollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByStatus(PollStatus status);
    List<Poll> findByStatusAndClosesAtBefore(PollStatus status, LocalDateTime dateTime);
}

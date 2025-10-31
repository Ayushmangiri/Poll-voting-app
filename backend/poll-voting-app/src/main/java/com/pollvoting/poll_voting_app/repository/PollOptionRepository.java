package com.pollvoting.poll_voting_app.repository;

import com.pollvoting.poll_voting_app.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
}

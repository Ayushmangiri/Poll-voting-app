package com.pollvoting.poll_voting_app.service;

import com.pollvoting.poll_voting_app.dto.PollRequest;
import com.pollvoting.poll_voting_app.dto.PollResponse;
import com.pollvoting.poll_voting_app.dto.VoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PollController {

    private final PollService pollService;

    // ✅ Get all polls
    @GetMapping
    public ResponseEntity<List<PollResponse>> getAllPolls(Authentication auth) {
        return ResponseEntity.ok(pollService.getAllPolls(auth.getName()));
    }

    // ✅ Get single poll by ID
    @GetMapping("/{pollId}")
    public ResponseEntity<PollResponse> getPollById(@PathVariable Long pollId, Authentication auth) {
        return ResponseEntity.ok(pollService.getPollById(pollId, auth.getName()));
    }

    // ✅ Create new poll (Admin only)
    @PostMapping
    public ResponseEntity<PollResponse> createPoll(@RequestBody PollRequest request, Authentication auth) {
        return ResponseEntity.ok(pollService.createPoll(request, auth.getName()));
    }

    // ✅ Update an existing poll (Admin only)
    @PutMapping("/{pollId}")
    public ResponseEntity<PollResponse> updatePoll(
            @PathVariable Long pollId,
            @RequestBody PollRequest request,
            Authentication auth) {
        return ResponseEntity.ok(pollService.updatePoll(pollId, request, auth.getName()));
    }

    // ✅ Close a poll (Admin only)
    @PostMapping("/{pollId}/close")
    public ResponseEntity<PollResponse> closePoll(
            @PathVariable Long pollId,
            Authentication auth) {
        return ResponseEntity.ok(pollService.closePoll(pollId, auth.getName()));
    }

    // ✅ Vote on a poll (returns updated poll info)
    @PostMapping("/{pollId}/vote")
    public ResponseEntity<?> vote(
            @PathVariable Long pollId,
            @RequestBody VoteRequest request,
            Authentication auth) {
        try {
            pollService.vote(pollId, request, auth.getName());
            return ResponseEntity.ok().body(Map.of("message", "Vote submitted successfully"));
        } catch (Exception e) {
            System.out.println("Vote endpoint error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Delete a poll (Admin only)
    @DeleteMapping("/{pollId}")
    public ResponseEntity<Void> deletePoll(@PathVariable Long pollId, Authentication auth) {
        pollService.deletePoll(pollId, auth.getName());
        return ResponseEntity.ok().build();
    }
}

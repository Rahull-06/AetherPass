package com.aetherpass.service;

import com.aetherpass.dto.response.VenueResponse;
import com.aetherpass.mapper.EventMapper;
import com.aetherpass.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VenueService {

    private final VenueRepository venueRepository;
    private final EventMapper eventMapper;

    public List<VenueResponse> listAll() {
        return venueRepository.findAllByOrderByCityAscNameAsc().stream()
                .map(eventMapper::toVenue)
                .toList();
    }
}

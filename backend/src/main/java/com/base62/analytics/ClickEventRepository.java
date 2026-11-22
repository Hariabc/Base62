package com.base62.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ClickEventRepository extends JpaRepository<ClickEventEntity, Long> {

    long countByUrlId(Long urlId);

    long countByUrlIdIn(List<Long> urlIds);

    List<ClickEventEntity> findByUrlIdAndClickedAtAfterOrderByClickedAtAsc(Long urlId, Instant since);

    List<ClickEventEntity> findByUrlIdInAndClickedAtAfterOrderByClickedAtAsc(List<Long> urlIds, Instant since);

    List<ClickEventEntity> findTop500ByUrlIdOrderByClickedAtDesc(Long urlId);

    List<ClickEventEntity> findTop500ByUrlIdInOrderByClickedAtDesc(List<Long> urlIds);
}

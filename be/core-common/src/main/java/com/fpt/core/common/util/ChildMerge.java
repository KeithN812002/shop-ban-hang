package com.fpt.core.common.util;

import lombok.experimental.UtilityClass;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@UtilityClass
public class ChildMerge {

    public static <E, D> List<E> mergeById(List<E> current, List<D> requests, Function<E, UUID> entityId,
                                           Function<D, UUID> requestId, Function<D, E> create,
                                           BiConsumer<D, E> update, Consumer<E> attach) {
        Map<UUID, E> existing = current.stream()
                .filter(item -> entityId.apply(item) != null)
                .collect(Collectors.toMap(entityId, item -> item));
        return requests.stream()
                .map(request -> {
                    UUID id = requestId.apply(request);
                    E entity = id != null ? existing.get(id) : null;
                    if (entity != null) {
                        update.accept(request, entity);
                    } else {
                        entity = create.apply(request);
                    }
                    attach.accept(entity);
                    return entity;
                })
                .toList();
    }
}

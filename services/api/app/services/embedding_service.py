"""
Embedding service using sentence-transformers (all-MiniLM-L6-v2).
Generates 384-dimensional embeddings for semantic similarity matching.
"""
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings
from loguru import logger
import numpy as np
from functools import lru_cache


@lru_cache(maxsize=1)
def _load_model() -> SentenceTransformer:
    """Load model once and cache in memory."""
    logger.info(f'Loading embedding model: {settings.EMBEDDING_MODEL}')
    model = SentenceTransformer(
        settings.EMBEDDING_MODEL,
        cache_folder=settings.MODEL_CACHE_DIR,
    )
    logger.info('Embedding model loaded successfully')
    return model


class EmbeddingService:
    def __init__(self):
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = _load_model()
        return self._model

    def encode(self, text: str) -> list[float]:
        """Encode a single text to a 384-dim embedding vector."""
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Encode multiple texts in batch (more efficient)."""
        embeddings = self.model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()

    def similarity(self, embedding_a: list[float], embedding_b: list[float]) -> float:
        """Compute cosine similarity between two embeddings. Returns 0.0–1.0."""
        a = np.array(embedding_a).reshape(1, -1)
        b = np.array(embedding_b).reshape(1, -1)
        score = cosine_similarity(a, b)[0][0]
        return float(np.clip(score, 0.0, 1.0))

    def top_k_similar(
        self,
        query_embedding: list[float],
        candidates: list[tuple[str, list[float]]],  # (id, embedding)
        k: int = 10,
    ) -> list[tuple[str, float]]:
        """Find top-k most similar embeddings from candidates. Returns [(id, score)]."""
        if not candidates:
            return []

        query = np.array(query_embedding).reshape(1, -1)
        candidate_embeddings = np.array([c[1] for c in candidates])
        scores = cosine_similarity(query, candidate_embeddings)[0]

        indexed = [(candidates[i][0], float(scores[i])) for i in range(len(candidates))]
        indexed.sort(key=lambda x: x[1], reverse=True)
        return indexed[:k]


embedding_service = EmbeddingService()

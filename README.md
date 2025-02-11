erDiagram

    %% 사용자 테이블
    USERS {
        UUID id PK
        STRING name
        STRING department
        STRING email
    }

    %% 채팅 테이블
    CHATS {
        TEXT id PK
        TEXT title
        TEXT createdAt
        TEXT focusMode
        JSONB files
        -- 사용자와 1:N 관계 (한 유저가 여러 채팅을 관리)
        UUID userId FK
    }

    %% 메시지 테이블
    MESSAGES {
        UUID id PK
        TEXT content
        TEXT messageId
        TEXT role
        JSONB metadata
        -- 채팅과 1:N 관계 (한 채팅에 여러 메시지가 소속)
        TEXT chatId FK
    }

    %% 공간(스페이스) 테이블
    SPACES {
        UUID id PK
        TEXT spaceName
        -- 기타 공유 설정이나 다른 정보가 있다면 추가
    }

    %% 공간 - 사용자 (M:N 관계)
    SPACE_USERS {
        UUID spaceId FK
        UUID userId FK
        -- Composite PK는 (spaceId, userId)로 설정 가능
    }

    %% 공간 - 채팅 (M:N 관계)
    SPACE_CHATS {
        UUID spaceId FK
        TEXT chatId FK
        -- Composite PK는 (spaceId, chatId)로 설정 가능
    }

    %% 관계 정의

    %% 1. USERS 와 CHATS
    USERS ||--o{ CHATS : "한 유저는 여러 채팅을 가질 수 있음"

    %% 2. CHATS 와 MESSAGES
    CHATS ||--o{ MESSAGES : "한 채팅에 여러 메시지가 존재"

    %% 3. SPACES 와 SPACE_USERS (M:N)
    SPACES ||--o{ SPACE_USERS : "한 공간은 여러 유저와 공유 가능"
    USERS  ||--o{ SPACE_USERS : "한 유저도 여러 공간에 참여 가능"

    %% 4. SPACES 와 SPACE_CHATS (M:N)
    SPACES ||--o{ SPACE_CHATS : "한 공간에 여러 채팅을 저장 가능"
    CHATS  ||--o{ SPACE_CHATS : "한 채팅이 여러 공간에 속할 수 있음"

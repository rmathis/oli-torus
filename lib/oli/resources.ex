defmodule Oli.Resources do
  import Ecto.Query, warn: false
  alias Oli.Repo

  alias Oli.Resources.Resource
  alias Oli.Resources.Revision
  alias Oli.Resources.ResourceType

  @doc """
  Returns the list of resources.
  ## Examples
      iex> list_resources()
      [%Resource{}, ...]
  """
  def list_resources do
    Repo.all(Resource)
  end

  @doc """
  Gets a single resource.
  Raises `Ecto.NoResultsError` if the Resource does not exist.
  ## Examples
      iex> get_resource!(123)
      %Resource{}
      iex> get_resource!(456)
      ** (Ecto.NoResultsError)
  """
  def get_resource!(id), do: Repo.get!(Resource, id)


  @doc """
  Gets a single resource, based on a revision  slug.
  """
  @spec get_resource_from_slug(String.t) :: any
  def get_resource_from_slug(revision) do
    query = from r in Resource,
          distinct: r.id,
          join: v in Revision, on: v.resource_id == r.id,
          where: v.slug == ^revision,
          select: r
    Repo.one(query)
  end

  @doc """
  Gets a list of resources, based on a list of revision slugs.
  """
  @spec get_resources_from_slug([]) :: any
  def get_resources_from_slug(revisions) do

    query = from r in Resource,
          distinct: r.id,
          join: v in Revision, on: v.resource_id == r.id,
          where: v.slug in ^revisions,
          select: r
    Repo.all(query)
  end

  @doc """
  Gets a list of resource ids and slugs, based on a list of revision slugs.
  """
  def map_resource_ids_from_slugs(revision_slugs) do

    query = from r in Revision,
          where: r.slug in ^revision_slugs,
          group_by: [r.slug, r.resource_id],
          select: map(r, [:slug, :resource_id])
    Repo.all(query)
  end

  def create_new_resource() do
    %Resource{}
    |> Resource.changeset(%{
    })
    |> Repo.insert()
  end


  @doc """
  Updates a resource.
  ## Examples
      iex> update_resource(resource, %{field: new_value})
      {:ok, %Resource{}}
      iex> update_resource(resource, %{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def update_resource(%Resource{} = resource, attrs) do
    resource
    |> Resource.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking resource changes.
  ## Examples
      iex> change_resource(resource)
      %Ecto.Changeset{source: %Resource{}}
  """
  def change_resource(%Resource{} = resource) do
    Resource.changeset(resource, %{})
  end

  @doc """
  Returns the list of resource_types.
  ## Examples
      iex> list_resource_types()
      [%ResourceType{}, ...]
  """
  def list_resource_types do
    Repo.all(ResourceType)
  end

  @doc """
  Gets a single resource_type.
  Raises `Ecto.NoResultsError` if the Resource type does not exist.
  ## Examples
      iex> get_resource_type!(123)
      %ResourceType{}
      iex> get_resource_type!(456)
      ** (Ecto.NoResultsError)
  """
  def get_resource_type!(id), do: Repo.get!(ResourceType, id)

  @doc """
  Creates a resource_type.
  ## Examples
      iex> create_resource_type(%{field: value})
      {:ok, %ResourceType{}}
      iex> create_resource_type(%{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def create_resource_type(attrs \\ %{}) do
    %ResourceType{}
    |> ResourceType.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a resource_type.
  ## Examples
      iex> update_resource_type(resource_type, %{field: new_value})
      {:ok, %ResourceType{}}
      iex> update_resource_type(resource_type, %{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def update_resource_type(%ResourceType{} = resource_type, attrs) do
    resource_type
    |> ResourceType.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking resource_type changes.
  ## Examples
      iex> change_resource_type(resource_type)
      %Ecto.Changeset{source: %ResourceType{}}
  """
  def change_resource_type(%ResourceType{} = resource_type) do
    ResourceType.changeset(resource_type, %{})
  end

  @doc """
  Returns the list of revisions.
  ## Examples
      iex> list_revisions()
      [%Revision{}, ...]
  """
  def list_revisions do
    Repo.all(Revision)
  end

  @doc """
  Gets a single revision.
  Raises `Ecto.NoResultsError` if the Resource revision does not exist.
  ## Examples
      iex> get_revision!(123)
      %Revision{}
      iex> get_revision!(456)
      ** (Ecto.NoResultsError)
  """
  def get_revision!(id), do: Repo.get!(Revision, id)

  @doc """
  Creates a revision.
  ## Examples
      iex> create_revision(%{field: value})
      {:ok, %Revision{}}
      iex> create_revision(%{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def create_revision(attrs \\ %{}) do

    %Revision{}
    |> Revision.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a revision.
  ## Examples
      iex> update_revision(revision, %{field: new_value})
      {:ok, %Revision{}}
      iex> update_revision(revision, %{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def update_revision(%Revision{} = revision, attrs) do
    revision
    |> Revision.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking revision changes.
  ## Examples
      iex> change_revision(revision)
      %Ecto.Changeset{source: %Revision{}}
  """
  def change_revision(%Revision{} = revision) do
    Revision.changeset(revision, %{})
  end

end
